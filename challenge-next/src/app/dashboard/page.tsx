/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import Head from "next/head";
import Header from "@/components/Header/Header";
import MobileMenu from "@/components/MobileMenu/MobileMenu";
import { apiService } from "@/services/apiService";

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

  // Estado para controle do menu mobile
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Estado para controlar se está usando dados mock
  const [useMockData, setUseMockData] = useState<boolean>(false);

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem("auth_token");
    const auth = localStorage.getItem("auth");
    
    if (!token || auth !== "true") {
      router.push(routes.login);
      return;
    }

    // Verificar se é um token mock (para desenvolvimento)
    const isMockToken = token.includes("mock-jwt-token");
    setUseMockData(isMockToken);

    // Carregar falhas
    carregarFalhas(isMockToken);
  }, [router]);

  // Função para tratar erros de autenticação (modificada para não redirecionar se for mock)
  const handleAuthError = (error: any) => {
    if (error.response?.status === 401 && !useMockData) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("auth");
      router.push(routes.login);
    }
  };

  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");
    localStorage.removeItem("auth");
    router.push(routes.login);
  };

  // Dados mock para desenvolvimento
  const getMockFalhas = (): Falha[] => {
    const mockData: Falha[] = [
      {
        id: 1,
        tipo: "Mecânica",
        descricao: "Problema no motor do ônibus linha 101",
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR'),
        status: "Pendente",
        timestamp: Date.now()
      },
      {
        id: 2,
        tipo: "Elétrica",
        descricao: "Falha no sistema de ar condicionado",
        data: new Date(Date.now() - 86400000).toLocaleDateString('pt-BR'), // Ontem
        hora: new Date(Date.now() - 86400000).toLocaleTimeString('pt-BR'),
        status: "Em Andamento",
        timestamp: Date.now() - 86400000
      },
      {
        id: 3,
        tipo: "Estrutural",
        descricao: "Rachadura no piso do veículo",
        data: new Date(Date.now() - 172800000).toLocaleDateString('pt-BR'), // 2 dias atrás
        hora: new Date(Date.now() - 172800000).toLocaleTimeString('pt-BR'),
        status: "Resolvido",
        timestamp: Date.now() - 172800000
      },
      {
        id: 4,
        tipo: "Software",
        descricao: "Sistema de GPS não está funcionando",
        data: new Date(Date.now() - 259200000).toLocaleDateString('pt-BR'), // 3 dias atrás
        hora: new Date(Date.now() - 259200000).toLocaleTimeString('pt-BR'),
        status: "Pendente",
        timestamp: Date.now() - 259200000
      }
    ];
    return mockData;
  };

  // Função para carregar todas as falhas (API ou Mock)
  const carregarFalhas = async (isMock: boolean = useMockData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isMock) {
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockFalhas = getMockFalhas();
        setFalhas(mockFalhas);
        setFilteredFalhas(mockFalhas);
      } else {
        // Usar API real
        const response = await apiService.getFalhas();
        
        // Processar os dados recebidos para o formato esperado pela UI
        const falhasProcessadas = response.map((falha: any) => {
          const dataObj = new Date(falha.dataCriacao || falha.created_at || Date.now());
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
      }
    } catch (err: any) {
      console.error("Erro ao carregar falhas:", err);
      
      if (isMock) {
        // Se for mock e der erro, usar dados vazios
        setFalhas([]);
        setFilteredFalhas([]);
        setError("Erro ao carregar dados mock");
      } else {
        const errorMessage = err.response?.data?.message || err.message || "Erro ao carregar as falhas";
        setError(errorMessage);
        handleAuthError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar uma nova falha (API ou Mock)
  const adicionarFalha = async () => {
    if (!description.trim()) {
      alert("Por favor, adicione uma descrição para a falha");
      return;
    }

    try {
      if (useMockData) {
        // Simular adição mock
        const novaFalha: Falha = {
          id: Date.now(), // ID único baseado no timestamp
          tipo: tipoFalha,
          descricao: description,
          data: new Date().toLocaleDateString('pt-BR'),
          hora: new Date().toLocaleTimeString('pt-BR'),
          status: "Pendente",
          timestamp: Date.now()
        };

        // Atualizar estado local
        const novasFalhas = [novaFalha, ...falhas];
        setFalhas(novasFalhas);

        if (!appliedFilter) {
          setFilteredFalhas(novasFalhas);
        } else {
          aplicarFiltro(novasFalhas);
        }
      } else {
        // Usar API real
        const novaFalha: NovaFalha = {
          tipo: tipoFalha,
          descricao: description
        };

        const response = await apiService.createFalha(novaFalha);
        
        const dataObj = new Date(response.dataCriacao || response.created_at || Date.now());
        const falhaAdicionada: Falha = {
          id: response.id,
          tipo: response.tipo,
          descricao: response.descricao,
          data: dataObj.toLocaleDateString('pt-BR'),
          hora: dataObj.toLocaleTimeString('pt-BR'),
          status: response.status || "Pendente",
          timestamp: dataObj.getTime()
        };

        const novasFalhas = [falhaAdicionada, ...falhas];
        setFalhas(novasFalhas);

        if (!appliedFilter) {
          setFilteredFalhas(novasFalhas);
        } else {
          aplicarFiltro(novasFalhas);
        }
      }

      setDescription("");
      
      if (window.innerWidth < 768) {
        setShowAddModal(false);
      }
    } catch (err: any) {
      console.error("Erro ao adicionar falha:", err);
      const errorMessage = err.response?.data?.message || err.message || "Erro ao adicionar falha";
      alert(errorMessage);
      if (!useMockData) {
        handleAuthError(err);
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

  // Atualiza o status da falha (API ou Mock)
  const updateFalhaStatus = async () => {
    if (selectedFalha) {
      try {
        if (useMockData) {
          // Simular atualização mock
          const updatedFalha = { ...selectedFalha, status: modalStatus };
          const updatedFalhas = falhas.map((f) =>
            f.id === selectedFalha.id ? updatedFalha : f
          );
          
          setFalhas(updatedFalhas);
          aplicarFiltro(updatedFalhas);
          setSelectedFalha(updatedFalha);
        } else {
          // Usar API real
          const updatedFalhaData = await apiService.updateFalha(Number(selectedFalha.id), {
            status: modalStatus
          });

          const updatedFalha = { ...selectedFalha, status: modalStatus };
          const updatedFalhas = falhas.map((f) =>
            f.id === selectedFalha.id ? updatedFalha : f
          );
          
          setFalhas(updatedFalhas);
          aplicarFiltro(updatedFalhas);
          setSelectedFalha(updatedFalha);
        }
        
        // Fechar o modal após sucesso
        setTimeout(() => {
          setShowDetailsModal(false);
        }, 500);
      } catch (err: any) {
        console.error("Erro ao atualizar status:", err);
        const errorMessage = err.response?.data?.message || err.message || "Erro ao atualizar status";
        alert(errorMessage);
        if (!useMockData) {
          handleAuthError(err);
        }
      }
    }
  };

  // Função para formatar data para exibição
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Debug: Mostrar se está usando dados mock
  useEffect(() => {
    if (useMockData) {
      console.log("🔧 Modo de desenvolvimento ativo - usando dados mock");
    }
  }, [useMockData]);
  return (
    <div className="min-h-screen bg-marmota-light font-sans">
      <Head>
        <title>Marmota Mobilidade - Dashboard</title>
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
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        handleLogout={handleLogout}
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
                      onClick={() => carregarFalhas()}
                      className="mt-3 px-4 py-2 bg-marmota-primary text-white rounded-lg hover:bg-marmota-secondary transition-colors"
                    >
                      Tentar novamente
                      </button>
                  </div>
                </div>
              )}

              {/* Listagem de falhas */}
              {!loading && !error && (
                <>
                  {filteredFalhas.length === 0 ? (
                    <div className="text-center py-8">
                      {appliedFilter ? (
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mx-auto text-marmota-gray mb-4"
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
                          <p className="text-marmota-gray font-medium">
                            Nenhuma falha encontrada com os filtros aplicados
                          </p>
                          <button
                            onClick={limparFiltros}
                            className="mt-3 text-marmota-primary hover:text-marmota-secondary cursor-pointer"
                          >
                            Limpar filtros
                          </button>
                        </div>
                      ) : (
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mx-auto text-marmota-gray mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-marmota-gray font-medium">
                            Nenhuma falha cadastrada ainda
                          </p>
                          <p className="text-sm text-marmota-gray mt-2">
                            Adicione uma nova falha usando o menu lateral
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredFalhas.map((falha) => (
                        <div
                          key={falha.id}
                          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer"
                          onClick={() => openDetailsModal(falha)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-0 sm:mr-3 mb-2 sm:mb-0 ${getTipoClass(
                                    falha.tipo
                                  )}`}
                                >
                                  {falha.tipo}
                                </span>
                                <div className="flex items-center text-sm text-marmota-gray">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
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
                                  {falha.data} às {falha.hora}
                                </div>
                              </div>
                              <p className="text-marmota-dark font-medium text-sm mb-2">
                                {falha.descricao}
                              </p>
                              <div className="flex items-center">
                                <span className="text-xs text-marmota-gray mr-2">
                                  Status:
                                </span>
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    falha.status === "Resolvido"
                                      ? "bg-green-100 text-green-800"
                                      : falha.status === "Em Andamento"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {falha.status || "Pendente"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 sm:mt-0">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-marmota-gray"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botão Flutuante Mobile para Adicionar Falha */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-marmota-primary to-marmota-secondary hover:from-marmota-secondary hover:to-marmota-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
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

        {/* Modal de Adicionar Falha (Mobile) */}
        {showAddModal && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div className="bg-white w-full rounded-t-xl p-6 transform transition-transform duration-300 translate-y-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-semibold text-lg text-marmota-dark">
                  Adicionar Nova Falha
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-marmota-gray hover:text-marmota-dark cursor-pointer"
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-marmota-gray mb-2">
                    Tipo de Falha:
                  </label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-marmota-dark outline-none focus:border-marmota-primary"
                    value={tipoFalha}
                    onChange={(e) => setTipoFalha(e.target.value)}
                  >
                    <option>Mecânica</option>
                    <option>Elétrica</option>
                    <option>Software</option>
                    <option>Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-marmota-gray mb-2">
                    Descrição:
                  </label>
                  <textarea
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-marmota-dark outline-none focus:border-marmota-primary resize-none"
                    rows={4}
                    placeholder="Descreva o problema identificado..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-200 text-marmota-gray font-medium py-3 px-4 rounded-lg transition-colors hover:bg-gray-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={adicionarFalha}
                    className="flex-1 bg-gradient-to-r from-marmota-primary to-marmota-secondary hover:from-marmota-secondary hover:to-marmota-primary text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalhes da Falha */}
        {showDetailsModal && selectedFalha && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-semibold text-lg text-marmota-dark">
                  Detalhes da Falha
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-marmota-gray hover:text-marmota-dark cursor-pointer"
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-marmota-gray mb-1">
                    ID:
                  </label>
                  <p className="text-marmota-dark font-mono text-sm">
                    #{selectedFalha.id}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-marmota-gray mb-1">
                    Tipo:
                  </label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTipoClass(
                      selectedFalha.tipo
                    )}`}
                  >
                    {selectedFalha.tipo}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-marmota-gray mb-1">
                    Data e Hora:
                  </label>
                  <p className="text-marmota-dark">
                    {selectedFalha.data} às {selectedFalha.hora}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-marmota-gray mb-1">
                    Descrição:
                  </label>
                  <p className="text-marmota-dark leading-relaxed">
                    {selectedFalha.descricao}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-marmota-gray mb-2">
                    Status:
                  </label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-marmota-dark outline-none focus:border-marmota-primary"
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Resolvido">Resolvido</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 bg-gray-200 text-marmota-gray font-medium py-3 px-4 rounded-lg transition-colors hover:bg-gray-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={updateFalhaStatus}
                    className="flex-1 bg-gradient-to-r from-marmota-primary to-marmota-secondary hover:from-marmota-secondary hover:to-marmota-primary text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 cursor-pointer"
                  >
                    Atualizar Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;