import logger from '../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  getSupabaseClient,
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from '../utils/supabaseClient.js'
import { formatSupabaseError } from '../utils/errorUtils.js'
import { parseStringPromise } from 'xml2js'
import { TaxRegimeHistory } from '../types/index.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[NFe Import] Recebida requisição para user_id: ${user_id}`)
  const userSupabase = getSupabaseClient(token)

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
    }

    const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token)
    if (!userOrgAndPeriod) {
      logger.warn(
        `[NFe Import] Organização ou período contábil não encontrado para user_id: ${user_id}`,
      )
      return handleErrorResponse(
        res,
        403,
        'Organização ou período contábil não encontrado para o usuário.',
      )
    }
    const { organization_id } = userOrgAndPeriod

    if (!req.body || typeof req.body !== 'string') {
      return handleErrorResponse(
        res,
        400,
        'Corpo da requisição inválido. Esperado XML como string.',
      )
    }

    const xmlContent = req.body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedXml: any
    try {
      parsedXml = await parseStringPromise(xmlContent, { explicitArray: false, mergeAttrs: true })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (parseError: any) {
      logger.error(`[NFe Import] Erro ao fazer parsing do XML: ${parseError.message}`)
      return handleErrorResponse(res, 400, `Erro ao processar o XML: ${parseError.message}`)
    }

    // Extrair dados da NF-e
    const nfe = parsedXml.nfeProc.NFe.infNFe
    const ide = nfe.ide // Identificação da NF-e
    const emit = nfe.emit // Emitente
    const dest = nfe.dest // Destinatário
    const total = nfe.total.ICMSTot // Totais de ICMS
    if (!total) {
      logger.error(`[NFe Import] ICMSTot não encontrado no XML.`)
      return handleErrorResponse(res, 400, `Dados totais (ICMSTot) não encontrados no XML.`)
    }
    const prod = Array.isArray(nfe.det) ? nfe.det : [nfe.det] // Detalhes dos produtos/serviços

    const emissionDate = ide.dhEmi || ide.dEmi // Data de emissão
    const cnpjEmit = emit.CNPJ || emit.CPF // CNPJ/CPF do emitente
    const razaoSocialEmit = emit.xNome // Razão Social do emitente
    const ufEmit = emit.enderEmit.UF // UF do emitente
    const municipioEmit = emit.enderEmit.xMun // Município do emitente

    const cnpjDest = dest.CNPJ || dest.CPF // CNPJ/CPF do destinatário
    const razaoSocialDest = dest.xNome // Razão Social do destinatário
    const ufDest = dest.enderDest.UF // UF do destinatário
    const municipioDest = dest.enderDest.xMun // Município do destinatário

    const totalProducts = total.vProd ?? '0' // Valor total dos produtos
    const totalNFe = total.vNF ?? '0' // Valor total da NF-e
    const totalICMS = total.vICMS ?? '0' // Valor total do ICMS
    const totalIPI = total.vIPI ?? '0' // Valor total do IPI
    const totalPIS = total.vPIS ?? '0' // Valor total do PIS
    const totalCOFINS = total.vCOFINS ?? '0' // Valor total do COFINS

    // Determinar o regime tributário da organização na data da emissão
    let organizationTaxRegime: TaxRegimeHistory | null = null
    if (emissionDate) {
      const { data: regimes, error: regimeError } = await userSupabase
        .from('tax_regime_history')
        .select('*')
        .eq('organization_id', organization_id)
        .order('start_date', { ascending: false })

      if (regimeError) {
        logger.error(
          `[NFe Import] Erro ao buscar histórico de regime tributário: ${regimeError.message}`,
        )
        throw regimeError
      }

      const emissionDateTime = new Date(emissionDate)
      if (regimes && regimes.length > 0) {
        // Add check for null or undefined regimes and if it has elements
        for (const regimeEntry of regimes) {
          const startDate = new Date(regimeEntry.start_date)
          const endDate = new Date(regimeEntry.end_date)

          if (emissionDateTime >= startDate && emissionDateTime <= endDate) {
            organizationTaxRegime = regimeEntry
            break
          }
        }
      }
    }

    // Preparar os itens da nota
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (Array.isArray(prod) ? prod : [prod]).map((item: any) => ({
      description: item.prod.xProd,
      ncm: item.prod.NCM,
      quantity: parseFloat(item.prod.qCom),
      unit_value: parseFloat(item.prod.vUnCom),
      total_value: parseFloat(item.prod.vProd),
      icms_value: item.imposto?.ICMS?.ICMS?.vICMS ? parseFloat(item.imposto.ICMS.ICMS.vICMS) : 0,
      ipi_value: item.imposto?.IPI?.IPITrib?.vIPI ? parseFloat(item.imposto.IPI.IPITrib.vIPI) : 0,
      pis_value: item.imposto?.PIS?.PISAliq?.vPIS ? parseFloat(item.imposto.PIS.PISAliq.vPIS) : 0,
      cofins_value: item.imposto?.COFINS?.COFINSAliq?.vCOFINS
        ? parseFloat(item.imposto.COFINS.COFINSAliq.vCOFINS)
        : 0,
    }))

    const extractedData = {
      nfe_id: nfe.Id, // ID da NF-e (chave de acesso)
      emission_date: emissionDate,
      type: ide.tpNF === '0' ? 'entrada' : 'saida', // 0=entrada, 1=saída
      cnpj_emit: cnpjEmit,
      razao_social_emit: razaoSocialEmit,
      uf_emit: ufEmit,
      municipio_emit: municipioEmit,
      cnpj_dest: cnpjDest,
      razao_social_dest: razaoSocialDest,
      uf_dest: ufDest,
      municipio_dest: municipioDest,
      total_products: parseFloat(totalProducts),
      total_nfe: parseFloat(totalNFe),
      total_icms: parseFloat(totalICMS),
      total_ipi: parseFloat(totalIPI),
      total_pis: parseFloat(totalPIS),
      total_cofins: parseFloat(totalCOFINS),
      organization_tax_regime: organizationTaxRegime ? organizationTaxRegime.regime : null,
      items: items,
    }

    logger.info({ extractedData }, `[NFe Import] Dados extraídos e regime determinado:`)

    return res.status(200).json({
      message: 'XML processado com sucesso!',
      data: extractedData,
    })
  } catch (error: unknown) {
    logger.error({ error }, 'Erro inesperado na API de importação de NF-e:')
    const message = formatSupabaseError(error)
    return handleErrorResponse(res, 500, message)
  }
}
