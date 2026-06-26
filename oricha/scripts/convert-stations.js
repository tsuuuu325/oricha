// 駅データ.jp の station/line CSV を stations.js に変換するスクリプト。
// 使い方: node scripts/convert-stations.js <station.csv> <line.csv> <出力先stations.js>
const fs = require("fs");
const path = require("path");

function parseCsv(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(",");
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const rec = {};
    header.forEach((h, i) => (rec[h] = cols[i]));
    return rec;
  });
}

const [, , stationCsv, lineCsv, outFile] = process.argv;
if (!stationCsv || !lineCsv || !outFile) {
  console.error("使い方: node scripts/convert-stations.js <station.csv> <line.csv> <出力先stations.js>");
  process.exit(1);
}

const lineRows = parseCsv(lineCsv);
const lineNameByCd = new Map(lineRows.map(r => [r.line_cd, r.line_name]));

const stationRows = parseCsv(stationCsv).filter(r => r.e_status === "0");

// station_g_cd … 同一の物理駅をまとめるグループコード（路線ごとに行が分かれているため）
const groups = new Map();
for (const r of stationRows) {
  const key = r.station_g_cd;
  if (!groups.has(key)) {
    groups.set(key, {
      name: r.station_name,
      yomi: "",
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      lines: new Set(),
    });
  }
  const g = groups.get(key);
  const lineName = lineNameByCd.get(r.line_cd);
  if (lineName) g.lines.add(lineName);
}

const stations = [...groups.values()]
  .filter(g => Number.isFinite(g.lat) && Number.isFinite(g.lng))
  .map(g => ({ name: g.name, yomi: g.yomi, lat: g.lat, lng: g.lng, lines: [...g.lines] }));

const header = `// stations.js
// 駅データ.jp（station/line CSV）から自動生成。scripts/convert-stations.js で再生成可能。
// データ形式: { name, yomi, lat, lng, lines }
//   - yomi は駅データ.jp無料版CSVにかな列が無いため空文字（name で検索される）

`;

const body =
  "const STATIONS = " + JSON.stringify(stations, null, 0) + ";\n" +
  'if (typeof window !== "undefined") window.STATIONS = STATIONS;\n';

fs.writeFileSync(outFile, header + body, "utf8");
console.log(`書き出し完了: ${stations.length} 駅 -> ${outFile}`);
