
function formatDate(time) {
    const now = new Date(time);
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`; // YYHHDDNNMM
}

function formatDateOther(time) {
    const now = new Date(time);
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`; // YYHHDDNNMM
}

function getVocalHeadline(vocalCode) {
    const vocalCodeMap = {
        'HU_W': '<bVocHdlnCd>HE001</bVocHdlnCd>',
        'TY_W': '<bVocHdlnCd>HE002</bVocHdlnCd>',
        'HI_W': '<bVocHdlnCd>HE003</bVocHdlnCd>',
        'TO_A': '<bVocHdlnCd>HE004</bVocHdlnCd>',
        'SV_A': '<bVocHdlnCd>HE005</bVocHdlnCd>',
        'HU_A': '<bVocHdlnCd>HE006</bVocHdlnCd>',
        'TY_A': '<bVocHdlnCd>HE007</bVocHdlnCd>',
        'TR_W': '<bVocHdlnCd>HE008</bVocHdlnCd>',
        'TR_A': '<bVocHdlnCd>HE009</bVocHdlnCd>',
        'TI_W': '<bVocHdlnCd>HE010</bVocHdlnCd>',
        'HI_A': '<bVocHdlnCd>HE011</bVocHdlnCd>',
        'TI_A': '<bVocHdlnCd>HE012</bVocHdlnCd>',
        'BZ_W': '<bVocHdlnCd>HE013</bVocHdlnCd>',
        'IS_W': '<bVocHdlnCd>HE014</bVocHdlnCd>',
        'WS_W': '<bVocHdlnCd>HE015</bVocHdlnCd>',
        'HW_W': '<bVocHdlnCd>HE016</bVocHdlnCd>',
        'LE_W': '<bVocHdlnCd>HE017</bVocHdlnCd>',
        'ZR_Y': '<bVocHdlnCd>HE018</bVocHdlnCd>',
        'CF_W': '<bVocHdlnCd>HE019</bVocHdlnCd>',
        'LS_W': '<bVocHdlnCd>HE020</bVocHdlnCd>',
        'WW_Y': '<bVocHdlnCd>HE021</bVocHdlnCd>',
        'LB_Y': '<bVocHdlnCd>HE022</bVocHdlnCd>',
        'LE_Y': '<bVocHdlnCd>HE023</bVocHdlnCd>',
        'BZ_A': '<bVocHdlnCd>HE024</bVocHdlnCd>',
        'WS_A': '<bVocHdlnCd>HE025</bVocHdlnCd>',
        'FF_A': '<bVocHdlnCd>HE026</bVocHdlnCd>',
        'FA_A': '<bVocHdlnCd>HE027</bVocHdlnCd>',
        'FA_Y': '<bVocHdlnCd>HE028</bVocHdlnCd>',
        'HW_A': '<bVocHdlnCd>HE029</bVocHdlnCd>',
        'LE_A': '<bVocHdlnCd>HE030</bVocHdlnCd>',
        'SU_W': '<bVocHdlnCd>HE031</bVocHdlnCd>',
        'LS_Y': '<bVocHdlnCd>HE032</bVocHdlnCd>',
        'CF_A': '<bVocHdlnCd>HE033</bVocHdlnCd>',
        'ZF_Y': '<bVocHdlnCd>HE034</bVocHdlnCd>',
        'FG_Y': '<bVocHdlnCd>HE035</bVocHdlnCd>',
        'SM_Y': '<bVocHdlnCd>HE036</bVocHdlnCd>',
        'EC_W': '<bVocHdlnCd>HE037</bVocHdlnCd>',
        'EH_W': '<bVocHdlnCd>HE038</bVocHdlnCd>',
        'HZ_W': '<bVocHdlnCd>HE039</bVocHdlnCd>',
        'FZ_W': '<bVocHdlnCd>HE040</bVocHdlnCd>',
        'HT_Y': '<bVocHdlnCd>HE041</bVocHdlnCd>',
        'WC_Y': '<bVocHdlnCd>HE042</bVocHdlnCd>',
        'FR_Y': '<bVocHdlnCd>HE043</bVocHdlnCd>',
        'EC_A': '<bVocHdlnCd>HE044</bVocHdlnCd>',
        'EH_A': '<bVocHdlnCd>HE045</bVocHdlnCd>',
        'HZ_A': '<bVocHdlnCd>HE046</bVocHdlnCd>',
        'DS_W': '<bVocHdlnCd>HE047</bVocHdlnCd>',
        'WI_Y': '<bVocHdlnCd>HE048</bVocHdlnCd>',
        'SU_Y': '<bVocHdlnCd>HE049</bVocHdlnCd>',
        'AS_Y': '<bVocHdlnCd>HE050</bVocHdlnCd>',
        'WC_W': '<bVocHdlnCd>HE051</bVocHdlnCd>',
        'FZ_A': '<bVocHdlnCd>HE052</bVocHdlnCd>',
        'WC_A': '<bVocHdlnCd>HE053</bVocHdlnCd>',
        'AF_W': '<bVocHdlnCd>HE054</bVocHdlnCd>',
        'AF_Y': '<bVocHdlnCd>HE055</bVocHdlnCd>',
        'DU_Y': '<bVocHdlnCd>HE056</bVocHdlnCd>',
        'LW_Y': '<bVocHdlnCd>HE057</bVocHdlnCd>',
        'LS_A': '<bVocHdlnCd>HE058</bVocHdlnCd>',
        'HF_W': '<bVocHdlnCd>HE059</bVocHdlnCd>',
        'SR_W': '<bVocHdlnCd>HE060</bVocHdlnCd>',
        'GL_W': '<bVocHdlnCd>HE061</bVocHdlnCd>',
        'HF_A': '<bVocHdlnCd>HE062</bVocHdlnCd>',
        'UP_W': '<bVocHdlnCd>HE063</bVocHdlnCd>',
        'SE_W': '<bVocHdlnCd>HE064</bVocHdlnCd>',
        'SR_A': '<bVocHdlnCd>HE065</bVocHdlnCd>',
        'GL_A': '<bVocHdlnCd>HE066</bVocHdlnCd>',
        'MF_Y': '<bVocHdlnCd>HE067</bVocHdlnCd>',
        'MS_Y': '<bVocHdlnCd>HE068</bVocHdlnCd>',
        'SC_Y': '<bVocHdlnCd>HE069</bVocHdlnCd>',
        'UP_Y': '<bVocHdlnCd>HE073</bVocHdlnCd>',
        'LO_Y': '<bVocHdlnCd>HE074</bVocHdlnCd>',
        'AF_V': '<bVocHdlnCd>HE075</bVocHdlnCd>',
        'UP_A': '<bVocHdlnCd>HE076</bVocHdlnCd>',
        'TAV_W': '<bVocHdlnCd>HE077</bVocHdlnCd>',
        'TAV_A': '<bVocHdlnCd>HE078</bVocHdlnCd>',
        'TO_W': '<bVocHdlnCd>HE110</bVocHdlnCd>'
    };
    
    const vocalCodeEnd = vocalCodeMap[vocalCode] || '<bVocHdlnCd />';
    return vocalCodeEnd
}
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 CC
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function berecord(input) {
    const alert = input
    let description = alert.texts[0].description
                description = description.replaceAll('\\n', ' ')
                description = description.replaceAll('&', '&amp;')
                description = description.replaceAll('<', '&lt;')
                description = description.replaceAll('>', '&gt;')
                description = description.replaceAll('-', '')
                description = description.replaceAll(':', '')
    return `        
    <BERecord id="0000" locationKey="${alert.areaId}_${alert.phenomena}_${alert.significance}_${alert.eventTrackingNumber}_${alert.officeCode}" isWxscan="0">
            <action>NOT_USED</action>
            <BEHdr>
                <bPIL>${alert.productIdentifier}</bPIL>
                <bWMOHdr>NOT_USED</bWMOHdr>
                <bEvent>
                    <eActionCd eActionPriority="${alert.severityCode}">${alert.messageType == "New" ? "NEW" : "CON"}</eActionCd>
                    <eOfficeId eOfficeNm="${alert.officeName}">${alert.officeCode}</eOfficeId>
                    <ePhenom>${alert.phenomena}</ePhenom>
                    <eSgnfcnc>${alert.significance}</eSgnfcnc>
                    <eETN>${alert.eventTrackingNumber}</eETN>
                    <eDesc>${alert.eventDescription}</eDesc>
                    <eStTmUTC>NOT_USED</eStTmUTC>
                    <eEndTmUTC>${formatDate((alert.endTimeUTC * 1000 || alert.expireTimeUTC * 1000 || (Math.round(new Date() * 1000) + (48 * 60 * 60 * 1000))))}</eEndTmUTC>
                    <eSvrty>${alert.severityCode}</eSvrty>
                    <eTWCIId>NOT_USED</eTWCIId>
                    <eExpTmUTC>${formatDate(alert.expireTimeUTC * 1000)}</eExpTmUTC>
                </bEvent>
                <bLocations>
                    <bLocCd bLoc="${alert.areaName}" bLocTyp="${alert.areaTypeCode}">${alert.areaId}</bLocCd>
                    <bStCd bSt="${alert.adminDistrict}">${alert.adminDistrictCode}</bStCd>
                    <bUTCDiff>NOT_USED</bUTCDiff>
                    <bTzAbbrv>${alert.issueTimeLocalTimeZone}</bTzAbbrv>
                    <bCntryCd>${alert.countryCode}</bCntryCd>
                </bLocations>
                <bSgmtChksum>${alert.identifier}</bSgmtChksum>
                <procTm>${formatDateOther(alert.processTimeUTC * 1000)}</procTm>
            </BEHdr>
            <BEData>
                <bIssueTmUTC>>${formatDate(new Date(alert.issueTimeLocal) / 1)}</bIssueTmUTC>
                <bHdln>
                    <bHdlnTxt>${alert.headlineText}</bHdlnTxt>
                    ${getVocalHeadline(`${alert.phenomena}_${alert.significance}`)}
                </bHdln>
                <bNarrTxt bNarrTxtLang="${alert.texts[0].languageCode}">
                    <bLn>${description}</bLn>
                </bNarrTxt>
                <bSrchRslt>NOT_USED</bSrchRslt>
            </BEData>
            <clientKey>${alert.areaId}_${alert.phenomena}_${alert.significance}_${alert.eventTrackingNumber}_${alert.officeCode}</clientKey>
        </BERecord>
    `
};