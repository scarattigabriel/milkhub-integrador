import api from "./api.js";
// Identificar o tipo do arquivo pela extensão
export function tipoDoArquivo(arquivo) {
    if (!arquivo || arquivo.size <= 0 || arquivo.size > 10 * 1024 * 1024) throw new Error("Selecione um arquivo não vazio de até 10 MiB.");
    const tipos = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };
    const tipo = tipos[arquivo.name.split(".").pop().toLowerCase()];
    if (!tipo || (arquivo.type && arquivo.type !== tipo) || arquivo.name.length > 255 || /[\/\\\x00-\x1f\x7f]/.test(arquivo.name)) throw new Error("Selecione PDF, PNG ou JPEG com nome e formato compatíveis.");
    return tipo;
}
// Enviar o arquivo binário com seus dados para a API
async function anexar(arquivo, params) { return (await api.post("/documentos", arquivo, { params: { ...params, nomeArquivo: arquivo.name }, headers: { "Content-Type": tipoDoArquivo(arquivo) } })).data; }
// Pedir a exclusão do registro na API
async function excluir(codigo) { await api.delete(`/documentos/${codigo}`); }
// Buscar o conteúdo do documento para download
async function baixar(codigo) {
    try { return (await api.get(`/documentos/${codigo}/arquivo`, { responseType: "blob" })).data; }
    catch (erro) {

        if (erro.response?.data instanceof Blob) { try { erro.response.data = JSON.parse(await erro.response.data.text()); } catch { /* Manter a resposta original */ } }
        throw erro;
    }
}
// Criar o download no navegador e liberar o endereço temporário
export function salvarDownload(blob, nome) {
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = nome; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default { anexar, excluir, baixar };
