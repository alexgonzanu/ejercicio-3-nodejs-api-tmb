require("dotenv").config();
const debug = require("debug")("mi-app:principal");
const express = require("express");
const chalk = require("chalk");
const morgan = require("morgan");

const app = express();
const puerto = process.env.PUERTO || 5000;

const server = app.listen(puerto, () => {
  debug(chalk.yellow(`Servidor escuchando en el puerto ${chalk.green(puerto)}.`));
});

server.on("error", err => {
  debug(chalk.red("Ha ocurrido un error al levantar el servidor"));
  if (err.code === "EADDRINUSE") {
    debug(chalk.red(`El puerto ${puerto} está ocupado`));
  }
});

app.use(morgan("dev"));
app.use(express.static("public"));
