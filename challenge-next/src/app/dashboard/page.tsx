/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import Head from "next/head";
import Header from "@/components/Header/Header";
import MobileMenu from "@/components/MobileMenu/MobileMenu";
import axios from 'axios';

// URL base da API
const API_BASE_URL = "http://localhost:8080/api"; // Ajuste conforme a configuração do servidor Java

// Interface para tipagem das falhas
interface Falha {
  id: string | number;
  tipo: string;
  descricao: string;
  data: string;
  hora: string;
  status: string;
  timestamp?: number;
}

// Interface para criar uma nova falha
interface NovaFalha {
  tipo: string;
  descricao: string;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tipoFalha, setTipoFalha] = useState<string>("Mecânica");
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [filteredFalhas, setFilteredFalhas] = useState<Falha[]>([]);
  const [appliedFilter, setAppliedFilter] = useState<boolean>(false);
  const [tipoFiltro, setTipoFiltro] = useState<string>("Todos");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o modal de detalhes com atualização de status
  const [selectedFalha, setSelectedFalha] = useState<Falha | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [modalStatus, setModalStatus] = useState<string>("Pendente");

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem("auth");
    if (!token) {
      router.push(routes.login);
      return;
    }

    // Configurar interceptor para incluir token em todas as requisições
    axios.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Carregar falhas da API
    carregarFalhas();
  }, [router]);

  // Função para carregar todas as falhas da API
  const carregarFalhas = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/falhas`);
      
      // Processar os dados recebidos para o formato esperado pela UI
      const falhasProcessadas = response.data.map((falha: any) => {
        // Convertendo a data para o formato esperado
        const dataObj = new Date(falha.dataCriacao);
        return {
          id: falha.id,
          tipo: falha.tipo,
          descricao: falha.descricao,
          data: dataObj.toLocaleDateString('pt-BR'),
          hora: dataObj.toLocaleTimeString('pt-BR'),
          status: falha.status || "Pendente",
          timestamp: dataObj.getTime()
        };
      });
      
      setFalhas(falhasProcessadas);
      setFilteredFalhas(falhasProcessadas);
      setLoading(false);
    } catch (err: any) {
      setError("Erro ao carregar as falhas: " + (err.response?.data?.message || err.message));
      setLoading(false);
      // Se for erro de autenticação, redirecionar para login
      if (err.response?.status === 401) {
        localStorage.removeItem("auth");
        router.push(routes.login);
      }
    }
  };

  // Função para adicionar uma nova falha via API
  const adicionarFalha = async () => {
    if (!description.trim()) {
      alert("Por favor, adicione uma descrição para a falha");
      return;
    }

    try {
      const novaFalha: NovaFalha = {
        tipo: tipoFalha,
        descricao: description
      };

      const response = await axios.post(`${API_BASE_URL}/falhas`, novaFalha);
      
      // Processar a resposta para o formato esperado na UI
      const dataObj = new Date(response.data.dataCriacao);
      const falhaAdicionada: Falha = {
        id: response.data.id,
        tipo: response.data.tipo,
        descricao: response.data.descricao,
        data: dataObj.toLocaleDateString('pt-BR'),
        hora: dataObj.toLocaleTimeString('pt-BR'),
        status: response.data.status || "Pendente",
        timestamp: dataObj.getTime()
      };

      // Atualizar estado local
      const novasFalhas = [falhaAdicionada, ...falhas];
      setFalhas(novasFalhas);

      if (!appliedFilter) {
        setFilteredFalhas(novasFalhas);
      } else {
        aplicarFiltro(novasFalhas);
      }

      setDescription("");
      
      if (window.innerWidth < 768) {
        setShowAddModal(false);
      }
    } catch (err: any) {
      alert("Erro ao adicionar falha: " + (err.response?.data?.message || err.message));
      if (err.response?.status === 401) {
        localStorage.removeItem("auth");
        router.push(routes.login);
      }
    }
  };

  // Função para filtrar falhas
  const filtrarFalhas = (falhasParaFiltrar?: Falha[], tipoParam?: string) => {
    const falhasToFilter = falhasParaFiltrar || falhas;
    const tipoToUse = tipoParam !== undefined ? tipoParam : tipoFiltro;

    let resultado = [...falhasToFilter];

    if (tipoToUse !== "Todos") {
      resultado = resultado.filter((falha) => falha.tipo === tipoToUse);
    }

    if (!startDate && !endDate) {
      return resultado;
    }

    return resultado.filter((falha) => {
      const falhaDate = new Date(falha.timestamp || 0);

      // Criar datas garantindo que não haja deslocamento de fuso horário
      const dataInicio = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
      const dataFim = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;

      if (dataInicio) dataInicio.setMinutes(dataInicio.getMinutes() + dataInicio.getTimezoneOffset());
      if (dataFim) dataFim.setMinutes(dataFim.getMinutes() + dataFim.getTimezoneOffset());

      if (dataInicio && dataFim) {
        return falhaDate >= dataInicio && falhaDate <= dataFim;
      } else if (dataInicio) {
        return falhaDate >= dataInicio;
      } else if (dataFim) {
        return falhaDate <= dataFim;
      }
      return true;
    });
  };

  const aplicarFiltro = (falhasParaFiltrar?: Falha[]) => {
    const falhasFiltradas = filtrarFalhas(falhasParaFiltrar);
    setFilteredFalhas(falhasFiltradas);

    const temFiltroAplicado = startDate || endDate || tipoFiltro !== "Todos";
    setAppliedFilter(!!temFiltroAplicado);
  };

  const limparFiltros = () => {
    setStartDate("");
    setEndDate("");
    setTipoFiltro("Todos");
    setFilteredFalhas(falhas);
    setAppliedFilter(false);
  };

  const filtrarPorTipo = (tipo: string) => {
    setTipoFiltro(tipo);
    const falhasFiltradas = filtrarFalhas(falhas, tipo);
    setFilteredFalhas(falhasFiltradas);

    const temFiltroAplicado = startDate || endDate || tipo !== "Todos";
    setAppliedFilter(!!temFiltroAplicado);
  };

  const getTipoClass = (tipo: string) => {
    switch (tipo) {
      case "Mecânica":
        return "bg-blue-100 text-blue-800";
      case "Elétrica":
        return "bg-yellow-100 text-yellow-800";
      case "Estrutural":
        return "bg-green-100 text-green-800";
      case "Software":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Abre o modal de detalhes, definindo a falha selecionada e seu status atual
  const openDetailsModal = (falha: Falha) => {
    setSelectedFalha(falha);
    setModalStatus(falha.status || "Pendente");
    setShowDetailsModal(true);
  };

  // Atualiza o status da falha via API
  const updateFalhaStatus = async () => {
    if (selectedFalha) {
      try {
        // Chamar a API para atualizar o status
        await axios.put(`${API_BASE_URL}/falhas/${selectedFalha.id}/status`, {
          status: modalStatus
        });

        // Atualizar localmente após confirmação da API
        const updatedFalha = { ...selectedFalha, status: modalStatus };
        const updatedFalhas = falhas.map((f) =>
          f.id === selectedFalha.id ? updatedFalha : f
        );
        
        setFalhas(updatedFalhas);
        aplicarFiltro(updatedFalhas);
        setSelectedFalha(updatedFalha);
      } catch (err: any) {
        alert("Erro ao atualizar status: " + (err.response?.data?.message || err.message));
        if (err.response?.status === 401) {
          localStorage.removeItem("auth");
          router.push(routes.login);
        }
      }
    }
  };

  // Função para formatar data para exibição
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";

    // Criar uma nova data com o fuso horário local
    const date = new Date(dateString);

    // Formatar para DD/MM/YYYY (formato brasileiro)
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-marmota-light font-sans">
      <Head>
        <title>Marmota Mobilidade</title>
        <meta name="description" content="Sistema de gestão de mobilidade" />
        <link rel="icon" href="/marmota-icon.png" sizes="any" />
        <link rel="icon" href="/marmota-icon.png" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/marmota-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Header */}
      <Header />
      {/* Mobile Navigation */}
      <MobileMenu
        menuOpen={false}
        setMenuOpen={function (): void {
          throw new Error("Function not implemented.");
        }}
        handleLogout={function (): void {
          throw new Error("Function not implemented.");
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row mt-4">
          {/* Sidebar (Desktop) */}
          <div className="hidden md:block w-full md:w-60 bg-marmota-surface rounded-xl shadow-md md:mr-6 md:sticky md:top-4 md:self-start md:max-h-[calc(100vh-2rem)] md:overflow-y-auto mb-4 md:mb-0">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-display font-semibold text-marmota-dark text-lg">
                Menu
              </h3>
            </div>
            {/* Filtro por Tipo */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center mb-4">
                <h4 className="font-display font-medium text-marmota-dark">
                  Filtro por Tipo
                </h4>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2 text-marmota-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <div className="bg-white rounded-lg p-3 shadow-sm transition-all hover:shadow-md">
                  <select
                    className="w-full bg-white text-sm p-1.5 outline-none border border-gray-200 rounded-md text-marmota-dark font-medium"
                    value={tipoFiltro}
                    onChange={(e) => filtrarPorTipo(e.target.value)}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Mecânica">Mecânica</option>
                    <option value="Elétrica">Elétrica</option>
                    <option value="Software">Software</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                {tipoFiltro !== "Todos" && (
                  <div className="text-xs text-marmota-primary text-center font-medium mt-2">
                    Filtrado por: {tipoFiltro}
                  </div>
                )}
              </div>
            </div>
            {/* Filtro de Data */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center mb-4">
                <h4 className="font-display font-medium text-marmota-dark">
                  Filtro de Data
                </h4>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2 text-marmota-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 shadow-sm transition-all hover:shadow-md">
                  <label className="text-sm font-medium mb-1.5 block text-marmota-gray">
                    De:
                  </label>
                  <input
                    type="date"
                    className="text-sm w-full bg-white outline-none border border-gray-200 rounded-md p-1.5 text-marmota-dark font-mono"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm transition-all hover:shadow-md">
                  <label className="text-sm font-medium mb-1.5 block text-marmota-gray">
                    Até:
                  </label>
                  <input
                    type="date"
                    className="text-sm w-full bg-white outline-none border border-gray-200 rounded-md p-1.5 text-marmota-dark font-mono"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => aplicarFiltro()}
                    className="cursor-pointer flex-1 bg-gradient-to-r from-marmota-primary to-marmota-secondary hover:from-marmota-secondary hover:to-marmota-primary text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow transform hover:translate-y-px"
                  >
                    Filtrar
                  </button>
                  {appliedFilter && (
                    <button
                      onClick={limparFiltros}
                      className="cursor-pointer bg-gray-200 text-marmota-gray text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-300 hover:bg-gray-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Adicionar Falha (Desktop) */}
            <div className="p-5">
              <div className="flex items-center mb-4">
                <h4 className="font-display font-medium text-marmota-dark">
                  Adicionar Falha
                </h4>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2 text-marmota-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 shadow-sm transition-all hover:shadow-md">
                  <label className="text-sm font-medium mb-1.5 block text-marmota-gray">
                    Tipo:
                  </label>
                  <select
                    className="w-full bg-white text-sm p-1.5 outline-none border border-gray-200 rounded-md text-marmota-dark font-medium"
                    value={tipoFalha}
                    onChange={(e) => setTipoFalha(e.target.value)}
                  >
                    <option>Mecânica</option>
                    <option>Elétrica</option>
                    <option>Software</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm transition-all hover:shadow-md">
                  <label className="text-sm font-medium mb-1.5 block text-marmota-gray">
                    Descrição:
                  </label>
                  <textarea
                    className="w-full h-24 bg-white text-sm outline-none resize-none text-marmota-dark border border-gray-200 rounded-md p-2 font-medium"
                    placeholder="Insira a descrição..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
                <button
                  onClick={adicionarFalha}
                  className="cursor-pointer w-full bg-gradient-to-r from-marmota-primary to-marmota-secondary hover:from-marmota-secondary hover:to-marmota-primary text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow transform hover:translate-y-px"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Filtros Mobile */}
          <div className="md:hidden mb-4">
            <div className="bg-marmota-surface rounded-xl shadow-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-display font-medium text-marmota-dark text-sm">
                  Filtros
                </h4>
                {appliedFilter && (
                  <button
                    onClick={limparFiltros}
                    className="text-xs text-marmota-primary flex items-center cursor-pointer"
                  >
                    Limpar
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filtros lado a lado */}
              <div className="flex space-x-2">
                {/* Filtro por Tipo */}
                <div className="flex-1">
                  <div className="bg-white rounded-lg p-2 shadow-sm transition-all hover:shadow-md">
                    <label className="text-xs font-medium mb-1 block text-marmota-gray">
                      Tipo:
                    </label>
                    <select
                      className="w-full bg-white text-xs p-1 outline-none border border-gray-200 rounded-md text-marmota-dark font-medium"
                      value={tipoFiltro}
                      onChange={(e) => filtrarPorTipo(e.target.value)}
                    >
                      <option value="Todos">Todos</option>
                      <option value="Mecânica">Mecânica</option>
                      <option value="Elétrica">Elétrica</option>
                      <option value="Software">Software</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                {/* Filtro de Data (De) */}
                <div className="flex-1">
                  <div className="bg-white rounded-lg p-2 shadow-sm transition-all hover:shadow-md">
                    <label className="text-xs font-medium mb-1 block text-marmota-gray">
                      De:
                    </label>
                    <input
                      type="date"
                      className="text-xs w-full bg-white outline-none border border-gray-200 rounded-md p-1 text-marmota-dark font-mono"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filtro de Data (Até) */}
                <div className="flex-1">
                  <div className="bg-white rounded-lg p-2 shadow-sm transition-all hover:shadow-md">
                    <label className="text-xs font-medium mb-1 block text-marmota-gray">
                      Até:
                    </label>
                    <input
                      type="date"
                      className="text-xs w-full bg-white outline-none border border-gray-200 rounded-md p-1 text-marmota-dark font-mono"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Botão de filtrar */}
              <div className="mt-2">
                <button
                  onClick={() => aplicarFiltro()}
                  className="w-full bg-gradient-to-r cursor-pointer from-marmota-primary to-marmota-secondary hover:from-marmota-secondary hover:to-marmota-primary text-white text-xs font-medium py-2 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow"
                >
                  Aplicar Filtros
                </button>
              </div>

              {/* Indicadores de filtro aplicado */}
              {appliedFilter && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tipoFiltro !== "Todos" && (
                    <span className="text-xs bg-marmota-primary/10 text-marmota-primary px-2 py-0.5 rounded-full">
                      Tipo: {tipoFiltro}
                    </span>
                  )}
                  {startDate && (
                    <span className="text-xs bg-marmota-primary/10 text-marmota-primary px-2 py-0.5 rounded-full">
                      De: {formatDateForDisplay(startDate)}
                    </span>
                  )}
                  {endDate && (
                    <span className="text-xs bg-marmota-primary/10 text-marmota-primary px-2 py-0.5 rounded-full">
                      Até: {formatDateForDisplay(endDate)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo (Listagem de Falhas) */}
          <div className="flex-1">
            <div className="bg-marmota-surface min-h-96 w-full shadow-md rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="font-display font-semibold text-xl text-marmota-dark flex items-center mb-2 sm:mb-0">
                  Visão Geral
                  {appliedFilter && (
                    <span className="ml-2 text-xs bg-marmota-primary/10 text-marmota-primary px-2 py-1 rounded-full flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      Filtrado
                    </span>
                  )}
                </h2>
                <div className="text-sm text-marmota-gray">
                  Total: {filteredFalhas.length} falha(s)
                </div>
              </div>

              {/* Estado de carregamento */}
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-marmota-primary"></div>
                  <p className="mt-2 text-marmota-gray">Carregando falhas...</p>
                </div>
              )}

              {/* Estado de erro */}
              {error && !loading && (
                <div className="text-center py-8 bg-red-50 rounded-lg">
                  <div className="text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium mt-2">{error}</p>
                    <button 
                      onClick={carregarFalhas} 
                      className="mt-3 bg-red-100 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}

              {/* Estado sem resultados */}
              {!loading && !error && filteredFalhas.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-4 text-gray-500 font-medium">Nenhuma falha encontrada</p>
                  {appliedFilter && (
                    <button 
                      onClick={limparFiltros} 
                      className="mt-3 bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}

              {/* Lista de falhas */}
              {!loading && !error && filteredFalhas.length > 0 && (
                <div className="space-y-4">
                  {filteredFalhas.map((falha) => (
                    <div
                      key={falha.id}
                      onClick={() => openDetailsModal(falha)}
                      className="bg-white rounded-lg shadow-sm p-4 transition-all hover:shadow-md cursor-pointer"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTipoClass(falha.tipo)}`}>{falha.tipo}</span>
                          <span className="ml-3 text-xs text-marmota-gray">{falha.data} • {falha.hora}</span>
                        </div>
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            falha.status === "Resolvido" 
                              ? "bg-green-100 text-green-800" 
                              : falha.status === "Em Andamento" 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-gray-100 text-gray-800"
                          }`}>
                            {falha.status}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-marmota-dark line-clamp-2">{falha.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed right-6 bottom-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-marmota-primary to-marmota-secondary text-white shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Modal para adicionar falha (Mobile) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-display font-semibold text-marmota-dark text-lg">
                Adicionar Falha
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-marmota-gray hover:text-marmota-dark"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-marmota-light rounded-lg p-3">
                <label className="text-sm font-medium mb-1.5 block text-marmota-gray">
                  Tipo:
                </label>
                <select
                  className="w-full bg-white text-sm p-2 outline-none border border-gray-200 rounded-md text-marmota-dark font-medium"
                  value={tipoFalha}
                  onChange={(e) => setTipoFalha(e.target.value)}
                >
                  <option>Mecânica</option>
                  <option>Elétrica</option>
                  <option>Software</option>
                  <option>Outro</option>
                </select>
              </div>
              <div className="bg-marmota-light rounded-lg p-3">
                <label className="text-sm font-medium mb-1.5 block text-marmota-gray">
                  Descrição:
                </label>
                <textarea
                  className="w-full h-32 bg-white text-sm outline-none resize-none text-marmota-dark border border-gray-200 rounded-md p-2 font-medium"
                  placeholder="Insira a descrição..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <button
                onClick={adicionarFalha}
                className="w-full bg-gradient-to-r from-marmota-primary to-marmota-secondary hover:from-marmota-secondary hover:to-marmota-primary text-white text-sm font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Falha */}
      {showDetailsModal && selectedFalha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTipoClass(selectedFalha.tipo)}`}>
                  {selectedFalha.tipo}
                </span>
                <h3 className="font-display font-semibold text-marmota-dark text-lg ml-3">
                  Detalhes da Falha
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-marmota-gray hover:text-marmota-dark"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-sm text-marmota-gray">
                <div>ID: #{selectedFalha.id}</div>
                <div>{selectedFalha.data} • {selectedFalha.hora}</div>
              </div>
              
              <div className="bg-marmota-light rounded-lg p-4">
                <p className="text-marmota-dark whitespace-pre-wrap">{selectedFalha.descricao}</p>
              </div>
              
              <div className="bg-marmota-light rounded-lg p-4">
                <label className="text-sm font-medium mb-2 block text-marmota-gray">
                  Status:
                </label>
                <select
                  className="w-full bg-white text-sm p-2 outline-none border border-gray-200 rounded-md text-marmota-dark font-medium"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Resolvido">Resolvido</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={updateFalhaStatus}
                  className="flex-1 bg-gradient-to-r from-marmota-primary to-marmota-secondary hover:from-marmota-secondary hover:to-marmota-primary text-white text-sm font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow"
                >
                  Atualizar Status
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-gray-200 text-marmota-gray hover:bg-gray-300 text-sm font-medium py-3 px-4 rounded-lg transition-all duration-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <footer className="mt-8 py-4 text-center text-sm text-marmota-gray">
        <div className="max-w-7xl mx-auto px-4">
          © 2025 Marmota Mobilidade. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;