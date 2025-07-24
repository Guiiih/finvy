# Chatbot Contábil

Este endpoint fornece acesso a um assistente de IA treinado para responder a perguntas sobre contabilidade e sobre os dados da sua organização.

## Objeto Mensagem do Chatbot

| Atributo | Tipo | Descrição |
|---|---|---|
| `role` | `string` | O autor da mensagem (`user` ou `model`). |
| `content` | `string` | O conteúdo da mensagem. |

---

## Enviar uma Mensagem

Envia uma pergunta ou comando para o chatbot e recebe uma resposta contextual.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/chatbot</span>
</div>

### Corpo da Requisição

```json
{
  "message": "Qual foi o meu faturamento total no último trimestre?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Olá, Finvy!"
    },
    {
      "role": "model",
      "content": "Olá! Como posso ajudar você hoje?"
    }
  ]
}
```

| Atributo | Tipo | Descrição |
|---|---|---|
| `message` | `string` | **Obrigatório.** A nova mensagem do usuário. |
| `conversationHistory` | `array` | Opcional. Um array de objetos de Mensagem do Chatbot representando o histórico da conversa para manter o contexto. |

### Resposta

Retorna a resposta do modelo de IA.

```json
{
  "role": "model",
  "content": "Analisando seus dados... Seu faturamento total no último trimestre foi de R$ 150.000,00, com a maior parte vindo da venda de serviços de consultoria."
}
```