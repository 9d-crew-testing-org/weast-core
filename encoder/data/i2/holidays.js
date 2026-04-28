const Holidays = require('date-holidays');
const fs = require("fs");
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');

// Mapping between your XML holiday names and date-holidays names    
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
          holidayDate = new Date(found.date);
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
      return serializer.serializeToString(xmlDoc);
    }



const holidays = {
    "stock_sd": {
        filename: "SD_HolidayMappings.i2m",
        baseData: `<Data type="Mapping">
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
</Data>
`
    },
    "stock_hd": {
        filename: "HD_HolidayMappings.i2m",
        baseData: `<Data type="Mapping">
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
</Mapping>
</Data>`
    }
}

async function regenerateHolidays() {
    for (const key in holidays) {
        const holiday = holidays[key]
        const data = updateHolidayDates(holiday.baseData)
        fs.writeFileSync(path.join(__dirname, holiday.filename), data, "utf-8")
       //console.log("Just wrote new holiday files")
    }
}

const lib = require("../../mqttlib")

async function sendHolidaysLocalized() {
    const db = JSON.parse(fs.readFileSync(path.join(__dirname, "../../cues.json"), "utf-8"))
    const data = {hd: fs.readFileSync(path.join(__dirname, holidays["stock_hd"].filename), "utf-8"), sd: fs.readFileSync(path.join(__dirname, holidays["stock_sd"].filename), "utf-8")}

    for (const key in db) {
        const star = db[key]
        if(star.unitType == "xd") {
            lib.exec(`logMessage(File={0},Message=Your unit is registered as an I2XD and will be receiving HD Holidays. If this is incorrect please contact Weastley)`, star.topic)
            lib.sendI2Data(holidays["stock_hd"].filename.split(".i2m")[0], data.hd, star.topic)
        } else if(star.unitType == "jr") {
            lib.exec(`logMessage(File={0},Message=Your unit is registered as an I2JR and will be receiving SD Holidays. If this is incorrect please contact Weastley)`, star.topic)
            lib.sendI2Data(holidays["stock_sd"].filename.split(".i2m")[0], data.sd, star.topic)
        }
    }
}


async function run() {
    await regenerateHolidays()
    await sendHolidaysLocalized()
    await lib.exec("logMessage(File={0},Message=ClosedTelecom Receiver Holidays data has just been generated and will be sent to your personalized topic attached to your STAR in the Bot)", "i2/data")
    return `<Data type="CurrentObservations">
            <CurrentObservations id="000000000" locationKey="T00000000" isWxscan="0">
                <metadata>
                    <language>en-US</language>
                    <transaction_id>1759529949444:821013233</transaction_id>
                    <version>1</version>
                    <location_id>32401:4:US</location_id>
                    <units>e</units>
                    <expire_time_gmt>1759530069</expire_time_gmt>
                    <status_code>200</status_code>
                </metadata>
                <observation>
                    <class>observation</class><expire_time_gmt>1759529996</expire_time_gmt><obs_time>1759529396</obs_time><obs_time_local>2025-10-03T17:09:56-0500</obs_time_local><wdir>50</wdir><icon_code>28</icon_code><icon_extd>2800</icon_extd><sunrise>2025-10-03T06:37:39-0500</sunrise><sunset>2025-10-03T18:25:22-0500</sunset><day_ind>D</day_ind><uv_index>0</uv_index><uv_warning>0</uv_warning><wxman>wx1230</wxman><obs_qualifier_code></obs_qualifier_code><ptend_code>2</ptend_code><dow>Friday</dow><wdir_cardinal>NE</wdir_cardinal><uv_desc>Low</uv_desc><phrase_12char>M Cloudy</phrase_12char><phrase_22char>Mostly Cloudy</phrase_22char><phrase_32char>Mostly Cloudy</phrase_32char><ptend_desc>Falling</ptend_desc><sky_cover>Cloudy</sky_cover><clds>BKN</clds><obs_qualifier_severity></obs_qualifier_severity><vocal_key>OT83:OX2800</vocal_key>
                    <imperial>
                        <wspd>9</wspd><gust></gust><vis>10.000</vis><mslp>1017.5</mslp><altimeter>30.02</altimeter><temp>83</temp><dewpt>65</dewpt><rh>55</rh><wc>83</wc><hi>86</hi><temp_change_24hour>-2</temp_change_24hour><temp_max_24hour>85</temp_max_24hour><temp_min_24hour>67</temp_min_24hour><pchange>-0.04</pchange><feels_like>86</feels_like><snow_1hour>0.0</snow_1hour><snow_6hour>0.0</snow_6hour><snow_24hour>0.0</snow_24hour><snow_mtd>0.0</snow_mtd><snow_season>0.0</snow_season><snow_ytd>8.1</snow_ytd><snow_2day>0.0</snow_2day><snow_3day>0.0</snow_3day><snow_7day>0.0</snow_7day><ceiling>11000</ceiling><precip_1hour>0.00</precip_1hour><precip_6hour>0.00</precip_6hour><precip_24hour>0.00</precip_24hour><precip_mtd>0.00</precip_mtd><precip_ytd>41.11</precip_ytd><precip_2day>0.00</precip_2day><precip_3day>0.00</precip_3day><precip_7day>0.05</precip_7day><obs_qualifier_100char></obs_qualifier_100char><obs_qualifier_50char></obs_qualifier_50char><obs_qualifier_32char></obs_qualifier_32char>
                    </imperial>
                </observation>
                <clientKey>T00000000</clientKey>
            </CurrentObservations></Data>`
}

module.exports = run
