# Importação de NF-e

Este endpoint automatiza a entrada de dados a partir de um arquivo XML de Nota Fiscal Eletrônica (NF-e). Ele extrai as informações relevantes da nota e as retorna em um formato estruturado, prontas para serem usadas na criação de lançamentos contábeis.

## Objeto de Dados Extraídos

O endpoint retorna um objeto JSON com os dados da NF-e, incluindo informações do emitente, destinatário, totais e uma lista de itens.

---

## Processar um XML de NF-e

Envia o conteúdo de um arquivo XML de NF-e para ser processado.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/nfe-import</span>
</div>

### Corpo da Requisição

O corpo da requisição deve ser o **conteúdo completo do arquivo XML** enviado como uma string de texto (`Content-Type: text/plain` ou `application/xml`).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <!-- Conteúdo completo da NF-e -->
</nfeProc>
```

### Resposta

`200 OK` com os dados extraídos da nota fiscal.

```json
{
  "message": "XML processado com sucesso!",
  "data": {
    "nfe_id": "NFe352507...",
    "emission_date": "2025-07-24T10:00:00-03:00",
    "type": "saida", // ou "entrada"
    "cnpj_emit": "11.111.111/0001-11",
    "razao_social_emit": "Empresa Emitente LTDA",
    "cnpj_dest": "22.222.222/0001-22",
    "razao_social_dest": "Empresa Destinatária SA",
    "total_products": 100.00,
    "total_nfe": 112.00,
    "total_icms": 12.00,
    "total_ipi": 0.00,
    "total_pis": 1.65,
    "total_cofins": 7.60,
    "organization_tax_regime": "lucro_presumido",
    "items": [
      {
        "description": "Produto A",
        "ncm": "12345678",
        "quantity": 2,
        "unit_value": 50.00,
        "total_value": 100.00,
        "icms_value": 12.00,
        "ipi_value": 0.00,
        "pis_value": 1.65,
        "cofins_value": 7.60
      }
    ]
  }
}
```