require('dotenv').config();

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const secretKey = process.env.SHOPIFY_SECRET_KEY;
const store = process.env.SHOP;
const apiAgroUser = process.env.AGRO_API_USER;
const apiAgroPass = process.env.AGRO_API_PASS;

const express = require("express")
const bodyParser = require('body-parser');
const https = require('https');
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const urlApi = 'https://'+apiKey+':'+apiSecret+'@'+store+'/admin/api/2021-07';
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
        let info2 = list.data.datalist.map( async (o)=> {
          
          const list2 = await axios.get(urlApiAgro+'/ParametroValor?IdParametro='+o.Id+'&IdValorSeleccionado=')
          let res2 = {
            ...o,
            ...list2.data
          }
        //  console.log(res2)
          return res2
        })
        /*
        
          */
         console.log(info2)
        return res
      })
     return info
    })
    .catch(error => error)

  Promise.all(response2)
    .then(data => {
      resMain.values = data;
     // console.log(resMain);
      res.send(resMain);
    })
    .catch(err => err);
/*
    const response3 =  await Promise.all(response2)
    .then( async (item) => {
      console.log(item);
      let info =  item[0].map( async (i)=> {
        const list = await axios.get(urlApiAgro+'/ParametroValor?IdParametro='+i.Id+'&IdValorSeleccionado=')
        let res = {
          ...i,
          ...list.data
        }
        return res
      })
     // console.log(info);
     return info
    })
    .catch(error => error)

    Promise.all(response3)
    .then(data => {

      console.log(data);
    //  res.send(resMain);
    })
    .catch(err => err)
*/


});
app.post('/tuAgro', (req, res) => {
  const body = req.body;
  axios.post(urlApiAgro+'/LoginWebApi', {
      Usuario: apiAgroUser,
      Contrasenia: apiAgroPass
    })
    .then(function (response) {
      console.log(response.data.infouser.Token);
      res.send(response.data);
      let token = {
          headers: { Authorization: `Bearer ${response.data.infouser.Token}` }
      };
      axios.post(urlApiAgro+'/calculosauth', body, token)
      .then(function (response) {
        console.log(response.data);
       // res.send(response.data);
      });

    });
});
app.get('/inventaryProduct', (req, res) => {
  res.send({success: "Ok"});
});
app.post('/inventaryProduct', (req, res) => {
    const body = req.body;
    //console.log(body);
    //console.log(urlApi+'/locations.json');
    
    https.get(urlApi+'/variants/'+body.variant_id+'.json', (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        data = JSON.parse(data);
       
       if ('variant' in data) {
        https.get(urlApi+'/inventory_levels.json?inventory_item_ids='+data.variant.inventory_item_id, (resp2) => {
          let data2 = '';
          resp2.on('data', (chunk2) => {
            data2 += chunk2;
          });
          resp2.on('end', () => {
            data2 = JSON.parse(data2);
            let has_location = false;
            data2.inventory_levels.map((item) => { 
              if(item.location_id == body.location_id){
               // console.log(item);
                has_location = true;
                res.send(item);
              }
            });
            if(has_location == false){
              res.send({errors: "Not Found"});
            }
          });
        }).on("error", (err) => {
          res.send({errors: "Not Found"});
        });
      }
      else{
       // console.log(data);
        res.send({errors: "Not Found"});
      }
      });
    }).on("error", (err) => {
      res.send({errors: "Not Found"});
    });
    
  });


/*
const data = await client.get({
path: 'locations',
});
*/
app.listen(port, () => {
    console.log("El servidor está inicializado en el puerto 3000");
});