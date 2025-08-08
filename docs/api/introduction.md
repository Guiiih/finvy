# Introdução

O Finvy REST API permite que você interaja programaticamente com sua plataforma de gestão financeira e contábil.

## Endpoints Principais

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>**Listar Contas:** Obtenha o plano de contas da sua organização.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>**Criar Lançamento Contábil:** Registre transações financeiras.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>**Excluir Lançamentos em Lote:** Exclua múltiplos lançamentos contábeis de uma vez.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>**Atualizar Status de Lançamentos em Lote:** Altere o status de múltiplos lançamentos contábeis de uma vez.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>**Excluir Lançamentos em Lote:** Exclua múltiplos lançamentos contábeis de uma vez.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>**Atualizar Status de Lançamentos em Lote:** Altere o status de múltiplos lançamentos contábeis de uma vez.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>**Importar NF-e:** Automatize a entrada de dados de notas fiscais eletrônicas.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>**Interagir com Chatbot Contábil:** Obtenha respostas e insights contábeis via IA.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>**Gerar Próxima Referência:** Obtenha o próximo número de referência sequencial para um prefixo e período contábil específicos.</span>
</div>

<br>

<div style="display: flex; align-items: center; gap: 8px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>**Histórico de Lançamento:** Obtenha o histórico de alterações de um lançamento contábil específico.</span>
</div>

## Autenticação

Você pode gerar uma chave de API através do **dashboard**. As chaves de API estão associadas a uma organização inteira e podem ser usadas em várias implantações.

### Chave de API Admin

A chave de API de administrador é usada para a maioria das ações da API. As chaves de API de administrador começam com o prefixo `sk_`... Mantenha suas chaves de API secretas.

### Chave de API do Assistente

A chave de API do assistente é usada para gerar respostas do assistente de IA. As chaves de API do assistente começam com o prefixo `pk_`...
