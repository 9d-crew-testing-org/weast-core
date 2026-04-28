const Holidays = require('date-holidays');
const { DOMParser, XMLSerializer } = require('xmldom');

const holidays = {
    "stock_sd": {
        filename: "SD_HolidayMappings.i2m",
        baseData: `
<Mapping id="635910678077301200" name="HolidayMapping">
  <Holiday date="20251226">
    <Name>First Day of Hanukkah</Name>
    <Date>12/26/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_hanukkah_color</Icon>
    <RGBHero>222 173 57</RGBHero>
    <RGBLogo>222 173 57</RGBLogo>
    <RGBIcon>36 66 109</RGBIcon>
  </Holiday>
  <Holiday date="20250120">
    <Name>MLK Day</Name>
    <Date>01/20/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_mlkday_color</Icon>
    <RGBHero>217 161 12</RGBHero>
    <RGBLogo>217 161 12</RGBLogo>
    <RGBIcon>79 52 137</RGBIcon>
  </Holiday>
  <Holiday date="20250202">
    <Name>Groundhog Day</Name>
    <Date>02/02/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_groundhogday_color</Icon>
    <RGBHero>97 21 121</RGBHero>
    <RGBLogo>97 21 121</RGBLogo>
    <RGBIcon>174 133 187</RGBIcon>
  </Holiday>
  <Holiday date="20250214">
    <Name>Valentine's Day</Name>
    <Date>02/14/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_valentinesday_color</Icon>
    <RGBHero>221 27 137</RGBHero>
    <RGBLogo>221 27 137</RGBLogo>
    <RGBIcon>221 27 137</RGBIcon>
  </Holiday>
  <Holiday date="20250309">
    <Name>Spring Clock Change</Name>
    <Date>03/09/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_dls_spring_color</Icon>
    <RGBHero>107 188 121</RGBHero>
    <RGBLogo>107 188 121</RGBLogo>
    <RGBIcon>164 162 208</RGBIcon>
  </Holiday>
  <Holiday date="20250317">
    <Name>St. Patrick's Day</Name>
    <Date>03/17/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_stpatricksday_color</Icon>
    <RGBHero>5 134 11</RGBHero>
    <RGBLogo>5 134 11</RGBLogo>
    <RGBIcon>146 171 67</RGBIcon>
  </Holiday>
  <Holiday date="20250320">
    <Name>First Day of Spring</Name>
    <Date>03/20/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_spring_color</Icon>
    <RGBHero>200 129 209</RGBHero>
    <RGBLogo>200 129 209</RGBLogo>
    <RGBIcon>230 196 35</RGBIcon>
  </Holiday>
  <Holiday date="20250420">
    <Name>Easter</Name>
    <Date>04/20/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_easter_color</Icon>
    <RGBHero>232 117 195</RGBHero>
    <RGBLogo>232 117 195</RGBLogo>
    <RGBIcon>86 199 232</RGBIcon>
  </Holiday>
  <Holiday date="20250422">
    <Name>Earth Day</Name>
    <Date>04/22/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_earthday_color</Icon>
    <RGBHero>0 100 0</RGBHero>
    <RGBLogo>0 100 0</RGBLogo>
    <RGBIcon>66 135 68</RGBIcon>
  </Holiday>
  <Holiday date="20250425">
    <Name>Arbor Day</Name>
    <Date>04/25/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_arborday_color</Icon>
    <RGBHero>64 103 50</RGBHero>
    <RGBLogo>64 103 50</RGBLogo>
    <RGBIcon>141 211 114</RGBIcon>
  </Holiday>
  <Holiday date="20250511">
    <Name>Mother's Day</Name>
    <Date>05/11/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_mothersday_color</Icon>
    <RGBHero>248 143 163</RGBHero>
    <RGBLogo>248 143 163</RGBLogo>
    <RGBIcon>167 145 230</RGBIcon>
  </Holiday>
  <Holiday date="20250526">
    <Name>Memorial Day</Name>
    <Date>05/26/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_memorialday_color</Icon>
    <RGBHero>23 78 213</RGBHero>
    <RGBLogo>23 78 213</RGBLogo>
    <RGBIcon>214 47 47</RGBIcon>
  </Holiday>
  <Holiday date="20250615">
    <Name>Father's Day</Name>
    <Date>06/15/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_fathersday_color</Icon>
    <RGBHero>92 130 11</RGBHero>
    <RGBLogo>92 130 11</RGBLogo>
    <RGBIcon>3 107 193</RGBIcon>
  </Holiday>
  <Holiday date="20250620">
    <Name>First Day of Summer</Name>
    <Date>06/20/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_summer_color</Icon>
    <RGBHero>232 113 6</RGBHero>
    <RGBLogo>232 113 6</RGBLogo>
    <RGBIcon>18 180 169</RGBIcon>
  </Holiday>
  <Holiday date="20250704">
    <Name>Fourth of July</Name>
    <Date>07/04/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_fourthofjuly_color</Icon>
    <RGBHero>222 42 22</RGBHero>
    <RGBLogo>222 42 22</RGBLogo>
    <RGBIcon>3 85 157</RGBIcon>
  </Holiday>
  <Holiday date="20250901">
    <Name>Labor Day</Name>
    <Date>09/01/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_laborday_color</Icon>
    <RGBHero>28 50 88</RGBHero>
    <RGBLogo>165 45 48</RGBLogo>
    <RGBIcon>24 84 114</RGBIcon>
  </Holiday>
  <Holiday date="20250922">
    <Name>First Day of Fall</Name>
    <Date>09/22/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_fall_color</Icon>
    <RGBHero>167 65 1</RGBHero>
    <RGBLogo>167 65 1</RGBLogo>
    <RGBIcon>221 132 71</RGBIcon>
  </Holiday>
  <Holiday date="20251031">
    <Name>Halloween</Name>
    <Date>10/31/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_halloween_color</Icon>
    <RGBHero>215 159 0</RGBHero>
    <RGBLogo>215 159 0</RGBLogo>
    <RGBIcon>239 105 38</RGBIcon>
  </Holiday>
  <Holiday date="20251102">
    <Name>Fall Clock Change</Name>
    <Date>11/02/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_dlsfall_color</Icon>
    <RGBHero>179 173 0</RGBHero>
    <RGBLogo>179 173 0</RGBLogo>
    <RGBIcon>181 121 24</RGBIcon>
  </Holiday>
  <Holiday date="20251111">
    <Name>Veteran's Day</Name>
    <Date>11/11/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_veteransday_color</Icon>
    <RGBHero>138 48 48</RGBHero>
    <RGBLogo>138 48 50</RGBLogo>
    <RGBIcon>49 158 219</RGBIcon>
  </Holiday>
  <Holiday date="20251127">
    <Name>Thanksgiving</Name>
    <Date>11/27/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_thanksgiving_color</Icon>
    <RGBHero>184 84 35</RGBHero>
    <RGBLogo>184 84 35</RGBLogo>
    <RGBIcon>96 45 32</RGBIcon>
  </Holiday>
  <Holiday date="20251221">
    <Name>First Day of Winter</Name>
    <Date>12/21/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_winter_color</Icon>
    <RGBHero>14 16 93</RGBHero>
    <RGBLogo>14 16 93</RGBLogo>
    <RGBIcon>63 167 178</RGBIcon>
  </Holiday>
  <Holiday date="20251224">
    <Name>Christmas Eve</Name>
    <Date>12/24/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_christmas_color</Icon>
    <RGBHero>190 49 42</RGBHero>
    <RGBLogo>190 49 42</RGBLogo>
    <RGBIcon>35 102 53</RGBIcon>
  </Holiday>
  <Holiday date="20251225">
    <Name>Christmas</Name>
    <Date>12/25/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_christmas_color</Icon>
    <RGBHero>190 49 42</RGBHero>
    <RGBLogo>190 49 42</RGBLogo>
    <RGBIcon>35 102 53</RGBIcon>
  </Holiday>
  <Holiday date="20251231">
    <Name>New Year's Eve</Name>
    <Date>12/31/2025</Date>
    <Icon>domesticSD\\Holidays\\hol_newyears_color</Icon>
    <RGBHero>212 170 69</RGBHero>
    <RGBLogo>212 170 69</RGBLogo>
    <RGBIcon>237 67 99</RGBIcon>
  </Holiday>
  <Holiday date="20260101">
    <Name>New Year's Day</Name>
    <Date>01/01/2026</Date>
    <Icon>domesticSD\\Holidays\\\hol_newyears_color</Icon>
    <RGBHero>212 170 69</RGBHero>
    <RGBLogo>212 170 69</RGBLogo>
    <RGBIcon>237 67 99</RGBIcon>
  </Holiday>
</Mapping>
`
    },
    "stock_hd": {
        filename: "HD_HolidayMappings.i2m",
        baseData: `
<Mapping id="635910678077301200" name="HolidayMapping">
  <Holiday date="20250120">
    <Name>MLK Day</Name>
    <Date>01/20/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_mlkday_color</Icon>
    <RGBHero>217 161 12</RGBHero>
    <RGBLogo>217 161 12</RGBLogo>
    <RGBIcon>79 52 137</RGBIcon>
  </Holiday>
  <Holiday date="20250202">
    <Name>Groundhog Day</Name>
    <Date>02/02/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_groundhogday_color</Icon>
    <RGBHero>97 21 121</RGBHero>
    <RGBLogo>97 21 121</RGBLogo>
    <RGBIcon>174 133 187</RGBIcon>
  </Holiday>
  <Holiday date="20250214">
    <Name>Valentine's Day</Name>
    <Date>02/14/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_valentinesday_color</Icon>
    <RGBHero>221 27 137</RGBHero>
    <RGBLogo>221 27 137</RGBLogo>
    <RGBIcon>221 27 137</RGBIcon>
  </Holiday>
  <Holiday date="20250309">
    <Name>Spring Clock Change</Name>
    <Date>03/09/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_dls_spring_color</Icon>
    <RGBHero>107 188 121</RGBHero>
    <RGBLogo>107 188 121</RGBLogo>
    <RGBIcon>164 162 208</RGBIcon>
  </Holiday>
  <Holiday date="20250317">
    <Name>St. Patrick's Day</Name>
    <Date>03/17/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_stpatricksday_color</Icon>
    <RGBHero>5 134 11</RGBHero>
    <RGBLogo>5 134 11</RGBLogo>
    <RGBIcon>146 171 67</RGBIcon>
  </Holiday>
  <Holiday date="20250320">
    <Name>First Day of Spring</Name>
    <Date>03/20/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_spring_color</Icon>
    <RGBHero>200 129 209</RGBHero>
    <RGBLogo>200 129 209</RGBLogo>
    <RGBIcon>230 196 35</RGBIcon>
  </Holiday>
  <Holiday date="20250420">
    <Name>Easter</Name>
    <Date>04/20/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_easter_color</Icon>
    <RGBHero>232 117 195</RGBHero>
    <RGBLogo>232 117 195</RGBLogo>
    <RGBIcon>86 199 232</RGBIcon>
  </Holiday>
  <Holiday date="20250422">
    <Name>Earth Day</Name>
    <Date>04/22/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_earthday_color</Icon>
    <RGBHero>0 100 0</RGBHero>
    <RGBLogo>0 100 0</RGBLogo>
    <RGBIcon>66 135 68</RGBIcon>
  </Holiday>
  <Holiday date="20250425">
    <Name>Arbor Day</Name>
    <Date>04/25/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_arborday_color</Icon>
    <RGBHero>64 103 50</RGBHero>
    <RGBLogo>64 103 50</RGBLogo>
    <RGBIcon>141 211 114</RGBIcon>
  </Holiday>
  <Holiday date="20250511">
    <Name>Mother's Day</Name>
    <Date>05/11/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_mothersday_color</Icon>
    <RGBHero>248 143 163</RGBHero>
    <RGBLogo>248 143 163</RGBLogo>
    <RGBIcon>167 145 230</RGBIcon>
  </Holiday>
  <Holiday date="20250526">
    <Name>Memorial Day</Name>
    <Date>05/26/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_memorialday_color</Icon>
    <RGBHero>23 78 213</RGBHero>
    <RGBLogo>23 78 213</RGBLogo>
    <RGBIcon>214 47 47</RGBIcon>
  </Holiday>
  <Holiday date="20250615">
    <Name>Father's Day</Name>
    <Date>06/15/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_fathersday_color</Icon>
    <RGBHero>92 130 11</RGBHero>
    <RGBLogo>92 130 11</RGBLogo>
    <RGBIcon>3 107 193</RGBIcon>
  </Holiday>
  <Holiday date="20250620">
    <Name>First Day of Summer</Name>
    <Date>06/20/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_summer_color</Icon>
    <RGBHero>232 113 6</RGBHero>
    <RGBLogo>232 113 6</RGBLogo>
    <RGBIcon>18 180 169</RGBIcon>
  </Holiday>
  <Holiday date="20250704">
    <Name>Fourth of July</Name>
    <Date>07/04/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_fourthofjuly_color</Icon>
    <RGBHero>222 42 22</RGBHero>
    <RGBLogo>222 42 22</RGBLogo>
    <RGBIcon>3 85 157</RGBIcon>
  </Holiday>
  <Holiday date="20250901">
    <Name>Labor Day</Name>
    <Date>09/01/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_laborday_color</Icon>
    <RGBHero>28 50 88</RGBHero>
    <RGBLogo>165 45 48</RGBLogo>
    <RGBIcon>24 84 114</RGBIcon>
  </Holiday>
  <Holiday date="20250922">
    <Name>First Day of Fall</Name>
    <Date>09/22/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_fall_color</Icon>
    <RGBHero>167 65 1</RGBHero>
    <RGBLogo>167 65 1</RGBLogo>
    <RGBIcon>221 132 71</RGBIcon>
  </Holiday>
  <Holiday date="20251031">
    <Name>Halloween</Name>
    <Date>10/31/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_halloween_color</Icon>
    <RGBHero>215 159 0</RGBHero>
    <RGBLogo>215 159 0</RGBLogo>
    <RGBIcon>239 105 38</RGBIcon>
  </Holiday>
  <Holiday date="20251102">
    <Name>Fall Clock Change</Name>
    <Date>11/02/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_dlsfall_color</Icon>
    <RGBHero>179 173 0</RGBHero>
    <RGBLogo>179 173 0</RGBLogo>
    <RGBIcon>181 121 24</RGBIcon>
  </Holiday>
  <Holiday date="20251111">
    <Name>Veteran's Day</Name>
    <Date>11/11/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_veteransday_color</Icon>
    <RGBHero>138 48 48</RGBHero>
    <RGBLogo>138 48 50</RGBLogo>
    <RGBIcon>49 158 219</RGBIcon>
  </Holiday>
  <Holiday date="20251127">
    <Name>Thanksgiving</Name>
    <Date>11/27/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_thanksgiving_color</Icon>
    <RGBHero>184 84 35</RGBHero>
    <RGBLogo>184 84 35</RGBLogo>
    <RGBIcon>96 45 32</RGBIcon>
  </Holiday>
  <Holiday date="20251221">
    <Name>First Day of Winter</Name>
    <Date>12/21/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_winter_color</Icon>
    <RGBHero>14 16 93</RGBHero>
    <RGBLogo>14 16 93</RGBLogo>
    <RGBIcon>63 167 178</RGBIcon>
  </Holiday>
  <Holiday date="20251224">
    <Name>Christmas Eve</Name>
    <Date>12/24/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_christmas_color</Icon>
    <RGBHero>190 49 42</RGBHero>
    <RGBLogo>190 49 42</RGBLogo>
    <RGBIcon>35 102 53</RGBIcon>
  </Holiday>
  <Holiday date="20251225">
    <Name>Christmas</Name>
    <Date>12/25/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_christmas_color</Icon>
    <RGBHero>190 49 42</RGBHero>
    <RGBLogo>190 49 42</RGBLogo>
    <RGBIcon>35 102 53</RGBIcon>
  </Holiday>
    <Holiday date="20251226">
    <Name>First Day of Hanukkah</Name>
    <Date>12/26/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_hanukkah_color</Icon>
    <RGBHero>222 173 57</RGBHero>
    <RGBLogo>222 173 57</RGBLogo>
    <RGBIcon>36 66 109</RGBIcon>
  </Holiday>
  <Holiday date="20251231">
    <Name>New Year's Eve</Name>
    <Date>12/31/2025</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_newyears_color</Icon>
    <RGBHero>212 170 69</RGBHero>
    <RGBLogo>212 170 69</RGBLogo>
    <RGBIcon>237 67 99</RGBIcon>
  </Holiday>
  <Holiday date="20260101">
    <Name>New Year's Day</Name>
    <Date>01/01/2026</Date>
    <Icon>domestic\\AdSys\\Holidays\\Icons\\hol_newyears_color</Icon>
    <RGBHero>212 170 69</RGBHero>
    <RGBLogo>212 170 69</RGBLogo>
    <RGBIcon>237 67 99</RGBIcon>
  </Holiday>
</Mapping>`
    }
}

const holidayNameMap = {
    "MLK Day": "Martin Luther King Jr. Day",
    "Groundhog Day": "Groundhog Day",
    "Valentine's Day": "Valentine's Day",
    "Spring Clock Change": "Daylight Saving Time Start",
    "St. Patrick's Day": "St. Patrick's Day",
    "First Day of Spring": "March equinox",
    "Easter": "Easter Sunday",
    "Earth Day": "Earth Day",
    "Arbor Day": "Arbor Day",
    "Mother's Day": "Mother's Day",
    "Memorial Day": "Memorial Day",
    "Father's Day": "Father's Day",
    "First Day of Summer": "June solstice",
    "Fourth of July": "Independence Day",
    "Labor Day": "Labor Day",  // fixed spelling for US
    "First Day of Fall": "September equinox",
    "Halloween": "Halloween",
    "Fall Clock Change": "Daylight Saving Time End",
    "Veteran's Day": "Veterans Day",
    "Thanksgiving": "Thanksgiving Day",
    "First Day of Winter": "December solstice",
    "Christmas Eve": "Christmas Eve",
    "Christmas": "Christmas Day",
    "New Year's Eve": "New Year's Eve",
    "New Year's Day": "New Year's Day",
    "First Day of Hanukkah": "Hanukkah"
};
const fs = require("fs")
const path = require("path")
function updateHolidayDates(xmlString) {
    const hd = new Holidays('US');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const holidays = Array.from(xmlDoc.getElementsByTagName("Holiday"));
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - 3);

    let updated = [];

    for (let holiday of holidays) {
    const nameNode = holiday.getElementsByTagName("Name")[0];
    if (!nameNode) continue;

    const xmlName = nameNode.textContent.trim();
    const mappedName = holidayNameMap[xmlName] || xmlName;

    let holidayDate;
    const year = today.getFullYear();

    function findHoliday(year) {
        const hdList = hd.getHolidays(year);
        // case-insensitive, partial match
        return hdList.find(h =>
        h.name.toLowerCase().includes(mappedName.toLowerCase())
        );
    }

    let found = findHoliday(year) || findHoliday(year + 1);

    if (found) {
        if(nameNode.textContent.trim() == "Fourth of July") {
            holidayDate = new Date(new Date(found.date) + (86000 * 1000));
        } else {
            holidayDate = new Date(found.date);
        }
    } else {
        // fallback: parse stored attribute
        const attrDate = holiday.getAttribute("date");
        if (!attrDate) continue;
        const y = parseInt(attrDate.substring(0, 4), 10);
        const m = parseInt(attrDate.substring(4, 6), 10) - 1;
        const d = parseInt(attrDate.substring(6, 8), 10);
        holidayDate = new Date(y, m, d);
    }

    // If more than 3 days past, jump to next year
    if (holidayDate < cutoffDate) {
        const nextFound = findHoliday(year + 1);
        if (nextFound) holidayDate = new Date(nextFound.date);
        else holidayDate.setFullYear(holidayDate.getFullYear() + 1);
        if(nameNode.textContent.trim() == "Fourth of July") {
            holidayDate.setDate(4);
        }
    }

    // Format & update XML
    const newDateStr = holidayDate.toISOString().slice(0, 10).replace(/-/g, "");
    const newDisplayDate =
        `${(holidayDate.getUTCMonth() + 1).toString().padStart(2, "0")}/` +
        `${holidayDate.getUTCDate().toString().padStart(2, "0")}/` +
        `${holidayDate.getUTCFullYear()}`;

    holiday.setAttribute("date", newDateStr);
    const dateNode = holiday.getElementsByTagName("Date")[0];
    if (dateNode) dateNode.textContent = newDisplayDate;

    updated.push({ holiday, date: holidayDate });
    }

    // Sort by date and reorder in XML
    updated.sort((a, b) => a.date - b.date);
    const parent = holidays[0].parentNode;
    updated.forEach(({ holiday }) => parent.appendChild(holiday));

    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc).replaceAll("  \n", "").replaceAll('  </Holiday>', '  </Holiday>\n');
}
async function generateHolidays() {
    const dir = path.join(__dirname, "../../../temp")
    if(!(fs.existsSync(dir))) {
        fs.mkdirSync(dir)
    }
    const hd = updateHolidayDates(holidays.stock_hd.baseData)
    const sd = updateHolidayDates(holidays.stock_sd.baseData)
    fs.writeFileSync(path.join(dir, holidays.stock_hd.filename), hd, "utf-8")
    fs.writeFileSync(path.join(dir, holidays.stock_sd.filename), sd, "utf-8")
    fs.writeFileSync(path.join(dir, "holidays_ts"), String(new Date() / 1000), "utf-8")
}

/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 CC
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */

module.exports = function holidaysRes(unit_type) {
    const unitType = String(unit_type).toLowerCase()
    const dir = path.join(__dirname, "../../../temp")
    if((!(fs.existsSync(path.join(dir, "holidays_ts")))) || ((Number(fs.readFileSync(path.join(dir, "holidays_ts"), "utf-8"))) + 86000) < (new Date() / 1000)) {
        generateHolidays()
    }
    if(unitType == "sd" || unitType == "jr") {
        return fs.readFileSync(path.join(dir, holidays.stock_sd.filename), "utf-8")
    } else {
        return fs.readFileSync(path.join(dir, holidays.stock_hd.filename), "utf-8")
    }
};
