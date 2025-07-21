import { parseStringPromise } from 'xml2js';
import fs from 'fs';

const sampleXml = `
<nfeProc>
    <NFe>
        <infNFe Id="NFe123">
            <ide>
                <dhEmi>2025-01-01</dhEmi>
                <tpNF>0</tpNF>
            </ide>
            <emit>
                <CNPJ>12345678901234</CNPJ>
                <xNome>Emitente Teste</xNome>
                <enderEmit>
                    <UF>SP</UF>
                    <xMun>Sao Paulo</xMun>
                </enderEmit>
            </emit>
            <dest>
                <CNPJ>98765432109876</CNPJ>
                <xNome>Destinatario Teste</xNome>
                <enderDest>
                    <UF>RJ</UF>
                    <xMun>Rio de Janeiro</xMun>
                </enderDest>
            </dest>
            <total>
                <ICMSTot>
                    <vProd>100.00</vProd>
                    <vNF>120.00</vNF>
                    <vICMS>18.00</vICMS>
                    <vIPI>2.00</vIPI>
                    <vPIS>0.65</vPIS>
                    <vCOFINS>3.00</vCOFINS>
                </ICMSTot>
            </total>
            <det>
                <prod>
                    <xProd>Produto A</xProd>
                    <NCM>12345678</NCM>
                    <qCom>1</qCom>
                    <vUnCom>100.00</vUnCom>
                    <vProd>100.00</vProd>
                </prod>
                <imposto>
                    <ICMS>
                        <ICMS>
                            <vICMS>18.00</vICMS>
                        </ICMS>
                    </ICMS>
                    <IPI>
                        <IPITrib>
                            <vIPI>2.00</vIPI>
                        </IPITrib>
                    </IPI>
                    <PIS>
                        <PISAliq>
                            <vPIS>0.65</vPIS>
                        </PISAliq>
                    </PIS>
                    <COFINS>
                        <COFINSAliq>
                            <vCOFINS>3.00</vCOFINS>
                        </COFINSAliq>
                    </COFINS>
                </imposto>
            </det>
        </infNFe>
    </NFe>
</nfeProc>
`;

async function parseAndLog() {
    try {
        const result = await parseStringPromise(sampleXml, { explicitArray: false, mergeAttrs: true });
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error parsing XML:', error);
    }
}

parseAndLog();