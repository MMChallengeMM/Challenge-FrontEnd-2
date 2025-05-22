"use client";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";
import { useState } from "react";
import Image from "next/image";
import Head from "next/head";
import { apiService } from "@/services/apiService";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Chamada para a API de autenticação usando Axios
      const data = await apiService.login(username, password);
      
      // Armazenar token JWT e informações do usuário
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_info", JSON.stringify(data.user));
      localStorage.setItem("auth", "true");
      
      router.push(routes.dashboard);
    } catch (error: any) {
      // Tratamento de erro do Axios
      console.error("Erro na autenticação:", error);
      
      // Com Axios, os erros HTTP têm uma estrutura específica
      if (error.response) {
        // O servidor respondeu com um status de erro
        const status = error.response.status;
        if (status === 401) {
          setError("Credenciais inválidas. Tente novamente.");
        } else if (status === 403) {
          setError("Conta bloqueada. Entre em contato com o administrador.");
        } else {
          setError(`Erro do servidor: ${error.response.data?.message || 'Tente novamente mais tarde.'}`);
        }
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        setError("Não foi possível conectar ao servidor. Verifique sua conexão.");
      } else {
        // Erro na configuração da requisição
        setError("Erro ao processar a requisição. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-marmota-light font-sans flex flex-col">
      <Head>
        <title>Login | Marmota Mobilidade</title>
        <meta name="description" content="Sistema de gestão de mobilidade" />
      </Head>

      {/* Header simplificado */}
      <header className="bg-gradient-to-r from-marmota-primary to-marmota-secondary shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center">
              <div className="h-10 w-10 relative mr-3">
                <Image
                  src="/marmota-icon.png"
                  alt="Marmota Logo"
                  layout="fill"
                  objectFit="contain"
                  className="drop-shadow-md"
                />
              </div>
              <div className="text-white font-display">
                <div className="font-semibold text-lg leading-none">
                  Marmota
                </div>
                <div className="font-medium text-sm tracking-wide">
                  Mobilidade
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Card principal */}
          <div className="bg-marmota-surface rounded-xl shadow-md overflow-hidden">
            {/* Barra superior decorativa */}
            <div className="h-2 bg-gradient-to-r from-marmota-primary to-marmota-secondary"></div>

            <div className="p-8">
              <h2 className="font-display font-semibold text-2xl text-marmota-dark mb-6 text-center">
                Acesso ao Sistema
              </h2>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="space-y-5">
                  {/* Campo de usuário */}
                  <div className="bg-white rounded-lg p-3 shadow-sm transition-all hover:shadow-md border border-gray-100">
                    <label className="text-sm font-medium mb-1.5 block text-marmota-gray">
                      Usuário:
                    </label>
                    <div className="flex">
                      <div className="text-marmota-gray flex items-center pr-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 text-sm w-full bg-white outline-none text-marmota-dark font-medium"
                        placeholder="Digite seu nome de usuário"
                        required
                      />
                    </div>
                  </div>

                  {/* Campo de senha */}
                  <div className="bg-white rounded-lg p-3 shadow-sm transition-all hover:shadow-md border border-gray-100">
                    <label className="text-sm font-medium mb-1.5 block text-marmota-gray">
                      Senha:
                    </label>
                    <div className="flex">
                      <div className="text-marmota-gray flex items-center pr-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 text-sm w-full bg-white outline-none text-marmota-dark font-medium"
                        placeholder="Digite sua senha"
                        required
                      />
                    </div>
                  </div>

                  {/* Botão de login */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="cursor-pointer w-full bg-gradient-to-r from-marmota-primary to-marmota-secondary hover:from-marmota-secondary hover:to-marmota-primary text-white text-sm font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow transform hover:translate-y-px flex justify-center items-center"
                  >
                    {isLoading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <span className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                          />
                        </svg>
                        Entrar
                      </span>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="#"
                  className="text-sm text-marmota-primary hover:underline transition-colors font-medium"
                >
                  Esqueceu sua senha?
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => router.push(routes.membros)}
              className="cursor-pointer text-sm bg-white hover:bg-gray-50 text-marmota-dark border border-gray-200 py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow flex items-center mx-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-marmota-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Ver Membros da Equipe
            </button>
          </div>

          {/* Nota de rodapé */}
          <div className="mt-6 text-center text-sm text-marmota-gray">
            © 2025 Marmota Mobilidade. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}