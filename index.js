require('dotenv').config();
const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const secretKey = process.env.SHOPIFY_SECRET_KEY;
const store = process.env.SHOP;
const express = require("express")
const bodyParser = require('body-parser');
const https = require('https');
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const urlApi = 'https://'+apiKey+':'+apiSecret+'@'+store+'/admin/api/2021-07';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});


app.get('/tuAgro', (req, res) => {

  let current = '';
  https.get('https://esaleslatam.bekaert.com:9020/AgriLogicAPI/api/ParametroCabecera?IdPais=2', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      data = JSON.parse(data);
     // res.send(data);
      data.datalist.map((item) => { 
        if(item.Nombre == "TIPO DE CERRAMIENTO"){
          current = item;
         // res.send(item);
          https.get('https://esaleslatam.bekaert.com:9020/AgriLogicAPI/api/ParametroValor?IdParametro='+item.Id+'&IdValorSeleccionado=', (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
              data += chunk;
            });
            resp.on('end', () => {
              current.values = JSON.parse(data);
              //res.send(asyncCall(current));
            //  callingTuAgro(current);
             // res.send(current);
/*   */ 
              current.values.datalist.map((item, node) => { 
                
               // console.log(node);
                https.get('https://esaleslatam.bekaert.com:9020/AgriLogicAPI/api/ParametroAsociado?IdPais=2&IdTipoCerramiento='+item.Id, (resp) => {
                  let data = '';
                  resp.on('data', (chunk) => {
                    data += chunk;
                  });
                  resp.on('end', () => {
                   data = JSON.parse(data);
                   current.values.datalist[node].values = data.datalist;
                   // console.log(current.values.datalist[node]);
                    if(current.values.datalist.length-1 == node){
                   //   console.log(current);
                      res.send(current);
                    }
                  });
                });
              });
           
            });
          });
        }
      });
      /*
      function calling_3(current) {
        return new Promise((resolve) => {
      current.values.datalist.map((item, node) => { 
          https.get('https://esaleslatam.bekaert.com:9020/AgriLogicAPI/api/ParametroAsociado?IdPais=2&IdTipoCerramiento='+item.Id, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
              data += chunk;
            });
            resp.on('end', () => {
              data = JSON.parse(data);
              current.values.datalist[node].values = data.datalist;
              // console.log(current.values.datalist[node]);
              if(current.values.datalist.length-1 == node){
              //   console.log(current);
               // res.send(current);
              
              }
            });
          });
        });
        resolve(current);
        });
       
      }
      async function asyncCall(current) {
        console.log('calling');
        const result = await calling_3(current);
        console.log(result);
        // Expected output: "resolved"
      }
*/
    });

  }).on("error", (err) => {
    res.send({errors: "Not Found"});
  });

/* */


//asyncCall();

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