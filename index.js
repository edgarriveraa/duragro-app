require('dotenv').config();

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const secretKey = process.env.SHOPIFY_SECRET_KEY;
const store = process.env.SHOP;
const apiAgroUser = process.env.AGRO_API_USER;
const apiAgroPass = process.env.AGRO_API_PASS;

const express = require("express")
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const urlApi = 'https://'+apiKey+':'+apiSecret+'@'+store+'/admin/api/2024-07';
const urlApiAgro = 'https://esaleslatam.bekaert.com:9020/AgriLogicAPI/api'
const axios = require("axios");

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});


app.get('/tuAgro', async (req, res) => {
  const query = req.query;
  
if(query.hasOwnProperty('form')){
 // console.log(query.form);
  const response = await axios.get(urlApiAgro+'/ParametroValor?IdParametro='+query.IdParametro+'&IdValorSeleccionado='+query.IdValorSeleccionado);
  res.send(response.data.datalist);
}
else{
 // console.log('init');

  const response = await axios.get(urlApiAgro+'/ParametroCabecera?IdPais=2');
  let resMain;
  const itemsList = await response.data.datalist.map( async (item) => {
    if(item.Nombre == "TIPO DE CERRAMIENTO"){
     let res = await axios.get(urlApiAgro+'/ParametroValor?IdParametro='+item.Id+'&IdValorSeleccionado=');
    resMain = item;
     return res.data.datalist
    }
  });

  const response2 =  await Promise.all(itemsList)
    .then( async (item) => {
      let info =  item[0].map( async (i)=> {
        const list = await axios.get(urlApiAgro+'/ParametroAsociado?IdPais=2&IdTipoCerramiento='+i.Id)
        let res = {
          ...i,
          ...list.data
        }
        return res
      })
     return info
    })
    .catch(error => error)

  Promise.all(response2)
    .then(data => {
      resMain.datalist = data;
      res.send(resMain);
    })
    .catch(err => err);
  }
});
app.post('/tuAgro', (req, res) => {
  const body = req.body;
  axios.post(urlApiAgro+'/LoginWebApi', {
      Usuario: apiAgroUser,
      Contrasenia: apiAgroPass
    })
    .then(function (response) {
     // console.log(response.data.infouser.Token);
      let token = {
          headers: { Authorization: `Bearer ${response.data.infouser.Token}` }
      };
      axios.post(urlApiAgro+'/calculosauth', body, token)
      .then(function (response) {
        res.send(response.data.datalist);
       // console.log(response.data);
       // res.send(response.data);
      });

    });
});
app.get('/inventaryProduct', (req, res) => {
  res.send({success: "Ok"});
});

app.post('/inventaryProduct', async (req, res) => {
    const body = req.body;
    const locations = await axios.get(urlApi+'/locations.json');
    const currentLocation = locations.data.locations.filter((i) => i.name == body.location_name);
    
    const response =  await Promise.all(currentLocation)
    .then( async (item) => {
      const variants = await axios.get(urlApi+'/variants/'+body.variant_id+'.json');
      const inventory_item = await axios.get(urlApi+'/inventory_levels.json?inventory_item_ids='+variants.data.variant.inventory_item_id);
      
    let info = inventory_item.data.inventory_levels.filter((i) => i.location_id == item[0].id);
    if(info.length == 0){
      info.push({"data": "Not Found :("});
    }
     return info[0]
    })
    .catch(error => error)

    res.send(response);
  });

app.listen(port, () => {
    console.log("El servidor está inicializado http://localhost:"+port);
});