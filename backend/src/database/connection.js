require('dotenv').config();

const { Sequelize } = require('sequelize');
const pg = require('pg');

const interpretarTimestampComFuso = pg.types.getTypeParser(1184);
pg.types.setTypeParser(1114, valor => interpretarTimestampComFuso(
    /infinity/i.test(valor) ? valor : `${valor}+00`
));

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        timezone: '+00:00',
        logging: false,
    }
);

module.exports = sequelize;
