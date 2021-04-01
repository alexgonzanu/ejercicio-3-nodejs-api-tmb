require("dotenv").config();
const debug = require("debug")("mi-app:principal");
const express = require("express");
const chalk = require("chalk");
const morgan = require("morgan");
const fetch = require("node-fetch");

const app = express();
const puerto = process.env.PUERTO || 5000;
const urlLineas = process.env.URL_TMB_LINIAS_METRO;
const appID = process.env.APP_ID_TMB;
const appKey = process.env.APP_KEY_TMB;

const server = app.listen(puerto, () => {
  debug(chalk.yellow(`Servidor escuchando en el puerto ${chalk.green(puerto)}.`));
});

server.on("error", err => {
  debug(chalk.red("Ha ocurrido un error al levantar el servidor"));
  if (err.code === "EADDRINUSE") {
    debug(chalk.red(`El puerto ${puerto} está ocupado`));
  }
});

const consultarLineas = async () => {
  let lineas = 0;
  const resp = await fetch(`${urlLineas}?app_id=${appID}&app_key=${appKey}`);
  const datos = await resp.json();
  lineas = datos.features.map(linea => ({
    id: linea.properties.CODI_LINIA,
    linea: linea.properties.NOM_LINIA,
    descripcion: linea.properties.DESC_LINIA
  }));
  return lineas;
};
const paradasLinea = async (codiLinea, nomLinea, descripcioLinea) => {
  const resp = await fetch(`${urlLineas}/${codiLinea}/estacions?app_id=${appID}&app_key=${appKey}`);
  const datos = await resp.json();
  return {
    linea: nomLinea,
    descripcion: descripcioLinea,
    paradas: datos.features.map(parada => ({
      id: parada.properties.ID_ESTACIO,
      nombre: parada.properties.NOM_ESTACIO
    }))
  };
};
const consultarParadasLinea = async (nombreParada, res) => {
  const resp = await fetch(`${urlLineas}?app_id=${appID}&app_key=${appKey}`);
  const datos = await resp.json();
  const lineaBuscada = datos.features.find(linea => linea.properties.NOM_LINIA === nombreParada);
  if (lineaBuscada) {
    const { CODI_LINIA, NOM_LINIA, DESC_LINIA } = lineaBuscada.properties;
    const paradaLinea = await paradasLinea(CODI_LINIA, NOM_LINIA, DESC_LINIA);
    return paradaLinea;
  }
};

app.use(morgan("dev"));
app.use(express.static("public"));
app.get("/metro/lineas", async (req, res, next) => {
  const lineas = await consultarLineas();
  res.json({ lineas });
});
app.get("/metro/linea/:nombreParada", async (req, res, next) => {
  const { nombreParada } = req.params;
  const paradaLineas = await consultarParadasLinea(nombreParada);
  if (!paradaLineas) {
    res.status(404).json({ error: "No se ha encontrado las paradas de la linea" });
  } else {
    res.json({ paradas: paradaLineas });
  }
});
