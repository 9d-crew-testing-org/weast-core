/**
 * Convert TWC XML Daily Forecast into IStar 2 DailyForecast XML
 * Built manually (no xml2js)
 * @param {Object} input - { data: string (XML), coopId: string }
 * @returns {string} Full <Data type="DailyForecast">...</Data> XML
 */
module.exports = function dailyFcst(input) {
    const xmlData = String(input.data);
    const coopId = input.coopId;

    // === Helper Functions ===

    // Extract value of a single tag safely
    function getValue(xml, tag, defaultValue = '') {
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
        const match = xml.match(regex);
        return match ? match[1] : defaultValue;
    }

    // Extract all occurrences of <forecast>...</forecast>
    function getForecastBlocks(xml) {
        return xml.match(/<forecast>[\s\S]*?<\/forecast>/g) || [];
    }

    // Extract a <day> or <night> block from a forecast
    function getPeriodBlock(xml, period) {
        const match = xml.match(new RegExp(`<${period}>[\\s\\S]*?</${period}>`));
        return match ? match[0] : '';
    }

    // Extract a tag’s value from a period sub-block
    function getPeriodValue(periodXml, tag, defaultValue = '') {
        return getValue(periodXml, tag, defaultValue);
    }

    // === Core Formatting ===

    // Build <day> or <night> block manually like formatDayOrNight()
    function formatDayOrNight(period, xml) {
        if (!xml) return '';

        const temp = getPeriodValue(xml, 'temp');
        if (!temp) return ''; // skip empty period

        return `
        <${period}>
            <fcst_valid>${getPeriodValue(xml, 'fcst_valid')}</fcst_valid>
            <fcst_valid_local>${getPeriodValue(xml, 'fcst_valid_local')}</fcst_valid_local>
            <day_ind>${getPeriodValue(xml, 'day_ind')}</day_ind>
            <thunder_enum>${getPeriodValue(xml, 'thunder_enum')}</thunder_enum>
            <daypart_name>${getPeriodValue(xml, 'daypart_name')}</daypart_name>
            <long_daypart_name>${getPeriodValue(xml, 'long_daypart_name')}</long_daypart_name>
            <alt_daypart_name>${getPeriodValue(xml, 'alt_daypart_name')}</alt_daypart_name>
            <thunder_enum_phrase>${getPeriodValue(xml, 'thunder_enum_phrase')}</thunder_enum_phrase>
            <num>${getPeriodValue(xml, 'num')}</num>
            <temp>${temp}</temp>
            <hi>${getPeriodValue(xml, 'hi')}</hi>
            <wc>${getPeriodValue(xml, 'wc')}</wc>
            <pop>${getPeriodValue(xml, 'pop')}</pop>
            <icon_extd>${getPeriodValue(xml, 'icon_extd')}</icon_extd>
            <icon_code>${getPeriodValue(xml, 'icon_code')}</icon_code>
            <wxman>${getPeriodValue(xml, 'wxman')}</wxman>
            <phrase_12char>${getPeriodValue(xml, 'phrase_12char')}</phrase_12char>
            <phrase_22char>${getPeriodValue(xml, 'phrase_22char')}</phrase_22char>
            <phrase_32char>${getPeriodValue(xml, 'phrase_32char')}</phrase_32char>
            <subphrase_pt1>${getPeriodValue(xml, 'subphrase_pt1')}</subphrase_pt1>
            <subphrase_pt2>${getPeriodValue(xml, 'subphrase_pt2')}</subphrase_pt2>
            <subphrase_pt3>${getPeriodValue(xml, 'subphrase_pt3')}</subphrase_pt3>
            <precip_type>${getPeriodValue(xml, 'precip_type')}</precip_type>
            <rh>${getPeriodValue(xml, 'rh')}</rh>
            <wspd>${getPeriodValue(xml, 'wspd')}</wspd>
            <wdir>${getPeriodValue(xml, 'wdir')}</wdir>
            <wdir_cardinal>${getPeriodValue(xml, 'wdir_cardinal')}</wdir_cardinal>
            <clds>${getPeriodValue(xml, 'clds')}</clds>
            <pop_phrase>${getPeriodValue(xml, 'pop_phrase')}</pop_phrase>
            <temp_phrase>${getPeriodValue(xml, 'temp_phrase')}</temp_phrase>
            <accumulation_phrase>${getPeriodValue(xml, 'accumulation_phrase')}</accumulation_phrase>
            <wind_phrase>${getPeriodValue(xml, 'wind_phrase')}</wind_phrase>
            <shortcast>${getPeriodValue(xml, 'shortcast')}</shortcast>
            <narrative>${getPeriodValue(xml, 'narrative')}</narrative>
            <vocal_key>${getPeriodValue(xml, 'vocal_key')}</vocal_key>
        </${period}>`;
    }

    // Build <forecast> block like formatForecast()
    function formatForecast(forecastXml) {
        const dayXml = getPeriodBlock(forecastXml, 'day');
        const nightXml = getPeriodBlock(forecastXml, 'night');

        const snowRange = getValue(forecastXml, 'snow_range').replace('<', '~');

        return `
        <forecast>
            <class>${getValue(forecastXml, 'class')}</class>
            <expire_time_gmt>${getValue(forecastXml, 'expire_time_gmt')}</expire_time_gmt>
            <fcst_valid>${getValue(forecastXml, 'fcst_valid')}</fcst_valid>
            <fcst_valid_local>${getValue(forecastXml, 'fcst_valid_local')}</fcst_valid_local>
            <num>${getValue(forecastXml, 'num')}</num>
            <max_temp>${getValue(forecastXml, 'max_temp')}</max_temp>
            <min_temp>${getValue(forecastXml, 'min_temp')}</min_temp>
            <torcon>${getValue(forecastXml, 'torcon')}</torcon>
            <stormcon>${getValue(forecastXml, 'stormcon')}</stormcon>
            <blurb>${getValue(forecastXml, 'blurb')}</blurb>
            <blurb_author>${getValue(forecastXml, 'blurb_author')}</blurb_author>
            <lunar_phase_day>${getValue(forecastXml, 'lunar_phase_day')}</lunar_phase_day>
            <dow>${getValue(forecastXml, 'dow')}</dow>
            <lunar_phase>${getValue(forecastXml, 'lunar_phase')}</lunar_phase>
            <lunar_phase_code>${getValue(forecastXml, 'lunar_phase_code')}</lunar_phase_code>
            <sunrise>${getValue(forecastXml, 'sunrise')}</sunrise>
            <sunset>${getValue(forecastXml, 'sunset')}</sunset>
            <moonrise>${getValue(forecastXml, 'moonrise')}</moonrise>
            <moonset>${getValue(forecastXml, 'moonset')}</moonset>
            <qualifier_code>${getValue(forecastXml, 'qualifier_code')}</qualifier_code>
            <qualifier>${getValue(forecastXml, 'qualifier')}</qualifier>
            <narrative>${getValue(forecastXml, 'narrative')}</narrative>
            <qpf>${getValue(forecastXml, 'qpf')}</qpf>
            <snow_qpf>${getValue(forecastXml, 'snow_qpf')}</snow_qpf>
            <snow_range>${snowRange}</snow_range>
            <snow_phrase>${getValue(forecastXml, 'snow_phrase')}</snow_phrase>
            <snow_code>${getValue(forecastXml, 'snow_code')}</snow_code>
            <vocal_key>${getValue(forecastXml, 'vocal_key')}</vocal_key>
            ${formatDayOrNight('night', nightXml)}
            ${formatDayOrNight('day', dayXml)}
        </forecast>`;
    }

    // === Main Assembly ===

    const metadataXML = getValue(xmlData, 'metadata');
    const forecastsXML = getForecastBlocks(xmlData).map(formatForecast).join('');

    const metadata = {
        language: getValue(metadataXML, 'language'),
        transaction_id: getValue(metadataXML, 'transaction_id'),
        version: getValue(metadataXML, 'version'),
        location_id: getValue(metadataXML, 'location_id'),
        units: getValue(metadataXML, 'units'),
        expire_time_gmt: getValue(metadataXML, 'expire_time_gmt'),
        status_code: getValue(metadataXML, 'status_code'),
    };

    // Assemble final XML
    let result = `
        <DailyForecast id="000000000" locationKey="${coopId}" isWxscan="0">
            <metadata>
                <language>${metadata.language}</language>
                <transaction_id>${metadata.transaction_id}</transaction_id>
                <version>${metadata.version}</version>
                <location_id>${metadata.location_id}</location_id>
                <units>${metadata.units}</units>
                <expire_time_gmt>${metadata.expire_time_gmt}</expire_time_gmt>
                <status_code>${metadata.status_code}</status_code>
            </metadata>
            <forecasts>${forecastsXML}</forecasts>
            <clientKey>${coopId}</clientKey>
        </DailyForecast>
    `;

    // Match top script behavior: replace "Mist" with "Damp Fog"
    result = result.replaceAll("Mist", "Damp Fog");

    // Wrap in <Data> container
    return result;
};
