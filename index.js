const axios = require("axios");
const cheerio = require("cheerio");
const XLSX = require("xlsx");
const fs = require("fs");

(async () => {
  const villaLinks = await getVillaLinks();
  const villaDetails = await getVillaDetails(villaLinks);
  createXLS(villaDetails);
})();

async function getVillaDetails(villaLinks) {
  const results = [];
  for (const link of villaLinks) {
    const url = `https://brela.hr/${link}`;
    const { data } = await axios({ url, method: "GET" });
    const $ = cheerio.load(data);
    const name = $("body > div.overmain > div > div > h1").text();
    const location = $("body > div.overmain > div > div > div.txt > div.k_podaci > div.k_1 > p").text().remove("\n").remove("\t");
    const contacts = $("body > div.overmain > div > div > div.txt > div.k_podaci > div.k_2 > p").text().remove("\t").split("\n");
    const telephone = contacts.find((str) => str.includes("Tel"));
    const gsm = contacts.find((str) => str.includes("GSM"));
    const email = contacts.find((str) => str.includes("@"));
    results.push({ name, location, telephone, gsm, email, url });
  }
  return results;
}

async function getVillaLinks(pageNumber = 1, results = []) {
  const { data } = await axios({ url: `https://brela.hr/hr/privatni-smjestaj/${pageNumber}`, method: "GET" });
  const $ = cheerio.load(data);
  const count = $("div.hot_data").length;
  for (let index = 1; index < count + 1; index += 1) {
    const link = $(`body > div.overmain > div > div > div.hots > div:nth-child(${index}) > div.hot_data > a`).attr("href");
    results.push(link);
  }
  if (count === 20) return getVillaLinks((pageNumber += 1), results);
  return results;
}

function createXLS(list) {
  if (list && list.length) {
    const name = `brela`;
    let arr = [["Name", "Location", "Email", "Telephone", "GSM", "Url"]];
    list.forEach((obj) => arr.push([obj.name, obj.location, obj.email, obj.telephone, obj.gsm, obj.url]));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(arr);

    wb.SheetNames.push(name);
    wb.Sheets[name] = ws;
    XLSX.writeFile(wb, `${name}.xlsx`);
  }
}

String.prototype.remove = function (search, newVal = "") {
  return this.split(search).join(newVal);
};
