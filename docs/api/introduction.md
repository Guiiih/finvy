# Introdução

O Finvy REST API permite que você interaja programaticamente com sua documentação, acione atualizações e incorpore experiências de bate-papo com IA.

## Endpoints

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>**Trigger Update:** Acione uma atualização do seu site quando desejado.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>**Get Update Status:** Obtenha o status de uma atualização e outros detalhes sobre seus documentos.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>**Generate Assistant Message:** Incorpore o assistente, treinado em seus documentos, em qualquer aplicativo de sua escolha.</span>
</div>


## Autenticação

Você pode gerar uma chave de API através do **dashboard**. As chaves de API estão associadas a uma organização inteira e podem ser usadas em várias implantações.

### Chave de API Admin

A chave de API de administrador é usada para a maioria das ações da API. É usada para acionar atualizações e obter o status da atualização. As chaves de API de administrador começam com o prefixo `sk_`... Mantenha suas chaves de API secretas.

### Chave de API do Assistente

A chave de API do assistente é usada para gerar respostas do assistente de IA. As chaves de API do assistente começam com o prefixo `pk_`...