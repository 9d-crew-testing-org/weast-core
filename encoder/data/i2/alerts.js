//const fetch = require('node-fetch');
const config = require('../../config.json');
const debug = require('../../debug').debug;

async function getAlerts(locations) {
    try {
        const alerts = await fetchAlerts(["US"])//, "CA"]);
        if (alerts.length === 0) {
            return `<Data type="BERecord">\n</Data>`;
        }

        const alertXmls = await Promise.all(
            alerts.map(fetchAndFormatAlertDetail)
        );

        debug("i2DG | Generated a 'alerts' i2Message.");
        return `<Data type="BERecord">${alertXmls.filter(Boolean).join("\n")}</Data>`;
    } catch (error) {
       //console.error("Error in getAlerts:", error);
        return `<Data type="BERecord">\n</Data>`;
    }
}

async function fetchAlerts(countryCodes) {
    const alerts = [];

    await Promise.all(countryCodes.map(async country => {
        try {
            const url = `https://api.weather.com/v3/alerts/headlines?countryCode=${country}&format=json&language=en-US&apiKey=${config.apiKey}`;
            const res = await fetch(url, {timeout:50000});
            if (res.status === 204 || res.status !== 200) return;

            const json = await res.json();
            if (!json.alerts) return;

            for (const alert of json.alerts) {
                alerts.push({
                    location: country,
                    locationId: `${alert.areaId}_${alert.phenomena}_${alert.significance}_${alert.eventTrackingNumber}_${alert.officeCode}`,
                    data: alert
                });
            }
        } catch (err) {
            // console.warn(`failed for ${country}`);
        }
    }));

    return alerts;
}


async function fetchAndFormatAlertDetail(alert) {
    try {
        const key = alert.data.detailKey;
        const res = await fetch(`https://api.weather.com/v3/alerts/detail?alertId=${key}&format=json&language=en-US&apiKey=${config.apiKey}`, {timeout:50000});
        if (res.status !== 200) return null;

        const json = await res.json();
        return generateAlertsXML(json.alertDetail, alert.locationId);
    } catch (err) {
       // console.error(`Failed to fetch detail for alert: ${alert.locationId}`, err);
        return null;
    }
}

function generateAlertsXML(alert, locationKey) {
    return `
        <BERecord id="0000" locationKey="${locationKey}" isWxscan="0">
            <action>NOT_USED</action>
            <BEHdr>
                <bPIL>${alert.productIdentifier}</bPIL>
                <bWMOHdr>NOT_USED</bWMOHdr>
                <bEvent>
                    <eActionCd eActionPriority="${alert.severityCode}">${handleAlertAction(alert.messageType)}</eActionCd>
                    <eOfficeId eOfficeNm="${alert.officeName}">${alert.officeCode}</eOfficeId>
                    <ePhenom>${alert.phenomena}</ePhenom>
                    <eSgnfcnc>${alert.significance}</eSgnfcnc>
                    <eETN>${alert.eventTrackingNumber}</eETN>
                    <eDesc>${alert.eventDescription}</eDesc>
                    <eStTmUTC>NOT_USED</eStTmUTC>
                    <eEndTmUTC>${formatDate(alert.endTimeUTC * 1000 || alert.expireTimeUTC * 1000)}</eEndTmUTC>
                    <eSvrty>${alert.severityCode}</eSvrty>
                    <eTWCIId>NOT_USED</eTWCIId>
                    <eExpTmUTC>${formatDate(alert.expireTimeUTC * 1000)}</eExpTmUTC>
                </bEvent>
                <bLocations>
                    <bLocCd bLoc="${alert.areaName}" bLocTyp="${alert.areaTypeCode}">${alert.areaId}</bLocCd>
                    <bStCd bSt="${alert.officeAdminDistrict}">${alert.officeAdminDistrictCode}</bStCd>
                    <bUTCDiff>NOT_USED</bUTCDiff>
                    <bTzAbbrv>${alert.issueTimeLocalTimeZone}</bTzAbbrv>
                    <bCntryCd>${alert.countryCode}</bCntryCd>
                </bLocations>
                <bSgmtChksum>${alert.identifier}</bSgmtChksum>
                <procTm>${formatDateOther(alert.processTimeUTC * 1000)}</procTm>
            </BEHdr>
            <BEData>
                <bIssueTmUTC>${formatDate(alert.processTimeUTC * 1000)}</bIssueTmUTC>
                <bHdln>
                    <bHdlnTxt>${alert.headlineText}</bHdlnTxt>
                    ${getVocalHeadline(`${alert.phenomena}_${alert.significance}`)}
                </bHdln>
                <bNarrTxt bNarrTxtLang="en-US">
                    <bLn>${processedDescription(alert)}</bLn>
                </bNarrTxt>
                <bSrchRslt>NOT_USED</bSrchRslt>
            </BEData>
            <clientKey>${locationKey}</clientKey>
        </BERecord>`;
}

function handleAlertAction(type) {
    switch (type) {
        case "Update": return "CON";
        case "New": return "NEW";
        default: return "NOT_USED";
    }
}

function processedDescription(alert) {
    try {
        const description = alert?.texts?.[0]?.description || 'NOT_USED';
        return description
            .replace(/\n/g, ' ')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/[-:]/g, '');
    } catch {
        return "NOT_USED";
    }
}

function formatDate(ms) {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function formatDateOther(ms) {
    const d = new Date(ms);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
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

module.exports = getAlerts;
