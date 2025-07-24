# Processador de Documentos

Este endpoint extrai texto de documentos enviados (PDFs, imagens), permitindo que o conteúdo seja analisado ou utilizado por outros serviços, como o [Chatbot Contábil](./chatbot.md) ou o [Resolvedor de Exercícios](./exercise-solver.md).

---

## Processar um Documento

Envia um arquivo para extração de texto.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/document-processor</span>
</div>

### Corpo da Requisição

A requisição deve ser do tipo `multipart/form-data` e conter um campo `file` com o documento a ser processado.

**Exemplo (HTML Form):**
```html
<form action="/api/document-processor" method="post" enctype="multipart/form-data">
  <input type="file" name="file">
  <button type="submit">Enviar</button>
</form>
```

### Limites

-   **Tipos de arquivo suportados:** PDF, PNG, JPG, etc.
-   **Tamanho máximo do arquivo:** 5MB.

### Resposta

`200 OK` com o texto extraído do documento.

```json
{
  "extractedText": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS... Cláusula 1: O objeto do presente contrato é a prestação de serviços de consultoria contábil..."
}
```