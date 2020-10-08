process.env.PORT = process.env.PORT || 3030;
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

let urlDB = "";
if (process.env.NODE_ENV === 'dev') {
    urlDB = "mongodb+srv://ruvo99:dbauser@webapp.3j4u8.mongodb.net/webAppData?retryWrites=true&w=majority"
} else {
    urlDB = "mongodb+srv://ruvo99:dbauser@webapp.3j4u8.mongodb.net/webAppData?retryWrites=true&w=majority"
};
process.env.URLDB = urlDB;

process.env.CADUCIDAD_TOKEN = '48h';

process.env.SEED_AUTENTICACION = process.env.SEED_AUTENTICACION || 'este-es-el-seed-desarrollo';