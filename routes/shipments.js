const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const axios = require("axios");
const { ConsoleMessage } = require("puppeteer");
var nodemailer = require("nodemailer");
router.use(require("body-parser").json());
const fs = require("fs").promises;

const {
  getOrderDetails,
  checkIfCod,
  getInsuranceValue,
  getOrderPackages,
} = require("./functions");
const { rootCertificates } = require("tls");
const { read, readSync } = require("fs");
const { randomFillSync } = require("crypto");

router.post("/email", async (req, res) => {
  console.log("req:", req.body);
  let emailTopic = req.body.email.topic;
  let emailContent = req.body.email.message;

  let emailAdresses = req.body.email.receivers;

  let labelNumbers = req.body.packages;
  let orderId = req.body.orderId;
  let moveToCategory = req.body.email.moveToCategory;
  let order_source = await getOrderDetails(orderId);
  emailContent = emailContent + prepEmailContent(order_source);
  //labelNumbers.push({courierCode: "paczkomaty", package_number:'642244367266620124418898',package_id :'36190738'})

  let labels = await getLabels(labelNumbers);

  if (labels.toString() === "ERROR") {
    res.json({ status: "ERROR" });
  } else {
    var response = await sendEmail(
      emailTopic,
      emailContent,
      emailAdresses,
      labels
    );
    if (moveToCategory) {
      await moveOrderToProperCategory(
        orderId,
        order_source.orders[0].order_source
      );
    }
    console.log("xd", response);
    res.json(response);
  }
});

router.post("/create", async (req, res) => {
  console.log("req: ", req.body.przesylka);

  let orderID = req.body.orderId;
  let deliveryMethod = req.body.deliveryMethod;
  //let deliveryMethod = 'Allegro DPD'
  let cod = req.body.przesylka.data.find((el) => el.name === "cod").value;
  let insurance = req.body.przesylka.data.find(
    (el) => el.name === "insurance"
  ).value;
  // let contents = req.body.przesylka.find(el => el.name === 'contents').value
  // let refnumber = req.body.przesylka.find(el => el.name === 'refnumber').value
  let packageSize = "";
  if (req.body.przesylka.data.find((el) => el.name === "size") != undefined) {
    packageSize = req.body.przesylka.data.find(
      (el) => el.name === "size"
    ).value;
  }
  let dimensions = req.body.przesylka.dimensions;

  console.log("deliveryMethod: " + deliveryMethod);

  let resp = await addPackage(
    orderID,
    packageSize,
    dimensions,
    deliveryMethod,
    cod,
    insurance
  );
  let details = await getOrderPackages(orderID);

  let obj = { ...resp, ...details };
  console.log("responseStatus", obj);

  res.json(obj);
});

router.post("/remove", async (req, res) => {
  let package_id = req.body.package_id;
  let package_number = req.body.package_number;
  let courier_code = req.body.courier_code;

  let response = await removePackage(courier_code, package_id, package_number);

  res.json(response);
});

router.get("/inpost", async (req, res) => {
  inpostReturn();
});
router.get("/inpost2", async (req, res) => {
  try {
    await inpostReturn2();
  } catch (error) {
    console.log(error);
  }
});

async function inpostReturn2() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      data = {
        receiver: {
          name: "Family24",
          company_name: "Kubartech magazyn B",
          first_name: "Aneta",
          last_name: "Krzypkowska",
          email: "andrysiakmaciejj@gmail.com",
          phone: "531108331",
          address: {
            street: "Częstochowska",
            building_number: "15",
            city: "Jaskrów",
            post_code: "42-244",
            country_code: "PL",
          },
        },
        parcels: [
          {
            id: "small package",
            dimensions: {
              length: "80",
              width: "360",
              height: "640",
              unit: "mm",
            },
            weight: {
              amount: "25",
              unit: "kg",
            },
            is_non_standard: false,
          },
        ],
        insurance: {
          amount: 25,
          currency: "PLN",
        },
        cod: {
          amount: 12.5,
          currency: "PLN",
        },
        service: "inpost_courier_standard",
        additional_services: ["email", "sms"],
        reference: "Test",
        comments: "dowolny komentarz",
      };

      try {
        var url =
          "https://sandbox-api-shipx-pl.easypack24.net/v1/organizations/38516/shipments";

        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " +
              "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkVzROZW9TeXk0OHpCOHg4emdZX2t5dFNiWHY3blZ0eFVGVFpzWV9TUFA4In0.eyJleHAiOjE5OTE5MjI5NjYsImlhdCI6MTY3NjU2Mjk2NiwianRpIjoiNjQ2MzBjNDEtNDlmZS00YWFiLThhZTItMjQxNjUwMTljMTA4IiwiaXNzIjoiaHR0cHM6Ly9zYW5kYm94LWxvZ2luLmlucG9zdC5wbC9hdXRoL3JlYWxtcy9leHRlcm5hbCIsInN1YiI6ImY6N2ZiZjQxYmEtYTEzZC00MGQzLTk1ZjYtOThhMmIxYmFlNjdiOl9wck5PeFhNdnVZcHBBQjduQW9YLWROQVpWTFV4VUJ0SFlHMk5nUHNWQnciLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzaGlweCIsInNlc3Npb25fc3RhdGUiOiI1ZWVlNjhmYi01MGNlLTRiZjctOTYwMi04NmRiNzc1MzYwYmUiLCJzY29wZSI6Im9wZW5pZCBhcGk6YXBpcG9pbnRzIGFwaTpzaGlweCIsInNpZCI6IjVlZWU2OGZiLTUwY2UtNGJmNy05NjAyLTg2ZGI3NzUzNjBiZSIsImFsbG93ZWRfcmVmZXJyZXJzIjoiIiwidXVpZCI6IjcyYWI2ZGI3LWRkMzItNGNjZS1hNDNhLTIyYTdiMjk4YzdjZSIsImVtYWlsIjoiYW5kcnlzaWFrbWFjaWVqakBnbWFpbC5jb20ifQ.EW8ZcBsfvjT-Yuus0zAtT8xCFm3MMMQaObIMVdaEyKI35u1KUObjy1G6NvUIO4tkcqvQL0DkkxQu262_NjIpd1VCg2ozBrHUaCQt1KvXf8neNgYL894jQgY_Kyi8CemMdBzFpFT2q3FGgmsWrAQyY-ihkNnsIdOwwOSrWAzWtxyOkdwwO0Q65c8EcgTLeiWaVsPE802_jxb8vVJzrRKo4vOlXyVQBEBDpNvoAbarOO2kXpmfgxH0ymu6I6QwYukFLdpF1RIogLO7WI6dYKa6_2LcgElxOvNJHknxO16j0nMEnydtc8mPuL7Yv3HTL3SKabp0_UMMOok7iy2ix4uzQg",
          },
          body: JSON.stringify(data),
        })
          .then((response) => {
            if (response.status === 200) return response.json();
            else reject(response);
          })
          .then((data) => {
            console.log("tutaj:" + data.status);
            resolve(data.id);
          });
      } catch (error) {
        console.log(error);
        reject(error);
      }
    }, 0);
  });
}

async function inpostReturn() {
  try {
    var url =
      "https://sandbox-api-shipx-pl.easypack24.net/v1/organizations/38516/shipments?created_at_gteq=2023-02-16T14:10+01:00";

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer " +
          "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkVzROZW9TeXk0OHpCOHg4emdZX2t5dFNiWHY3blZ0eFVGVFpzWV9TUFA4In0.eyJleHAiOjE5OTE5MjI5NjYsImlhdCI6MTY3NjU2Mjk2NiwianRpIjoiNjQ2MzBjNDEtNDlmZS00YWFiLThhZTItMjQxNjUwMTljMTA4IiwiaXNzIjoiaHR0cHM6Ly9zYW5kYm94LWxvZ2luLmlucG9zdC5wbC9hdXRoL3JlYWxtcy9leHRlcm5hbCIsInN1YiI6ImY6N2ZiZjQxYmEtYTEzZC00MGQzLTk1ZjYtOThhMmIxYmFlNjdiOl9wck5PeFhNdnVZcHBBQjduQW9YLWROQVpWTFV4VUJ0SFlHMk5nUHNWQnciLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzaGlweCIsInNlc3Npb25fc3RhdGUiOiI1ZWVlNjhmYi01MGNlLTRiZjctOTYwMi04NmRiNzc1MzYwYmUiLCJzY29wZSI6Im9wZW5pZCBhcGk6YXBpcG9pbnRzIGFwaTpzaGlweCIsInNpZCI6IjVlZWU2OGZiLTUwY2UtNGJmNy05NjAyLTg2ZGI3NzUzNjBiZSIsImFsbG93ZWRfcmVmZXJyZXJzIjoiIiwidXVpZCI6IjcyYWI2ZGI3LWRkMzItNGNjZS1hNDNhLTIyYTdiMjk4YzdjZSIsImVtYWlsIjoiYW5kcnlzaWFrbWFjaWVqakBnbWFpbC5jb20ifQ.EW8ZcBsfvjT-Yuus0zAtT8xCFm3MMMQaObIMVdaEyKI35u1KUObjy1G6NvUIO4tkcqvQL0DkkxQu262_NjIpd1VCg2ozBrHUaCQt1KvXf8neNgYL894jQgY_Kyi8CemMdBzFpFT2q3FGgmsWrAQyY-ihkNnsIdOwwOSrWAzWtxyOkdwwO0Q65c8EcgTLeiWaVsPE802_jxb8vVJzrRKo4vOlXyVQBEBDpNvoAbarOO2kXpmfgxH0ymu6I6QwYukFLdpF1RIogLO7WI6dYKa6_2LcgElxOvNJHknxO16j0nMEnydtc8mPuL7Yv3HTL3SKabp0_UMMOok7iy2ix4uzQg",
      },
      //body: JSON.stringify(data)
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
      });
  } catch (error) {
    console.log(error);
  }
}

async function addPackage(
  orderID,
  packageSize,
  dimensions,
  deliveryMethod,
  cod,
  insurance
) {
  try {
    await markOrderWithStar(orderID);

    let res = await createPackages(
      orderID,
      packageSize,
      dimensions,
      deliveryMethod,
      cod,
      insurance
    );

    await unmarkOrderWithStar(orderID);

    return res;
  } catch (exception) {
    console.log("addPackager Ex: " + exception);
    return "fail";
  } finally {
    await unmarkOrderWithStar(orderID);
  }
}

async function createPackages(
  orderID,
  packageSize,
  dimensions,
  deliveryMethod,
  cod,
  insurance
) {
  if (deliveryMethod === "Allegro DPD") {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (deliveryMethod === "Allegro UPS") {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (deliveryMethod === "Allegro DPD z granicę") {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (deliveryMethod === "Allegro One Punkt (One Kurier)") {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (deliveryMethod === "Allegro One Box (One Kurier)") {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (
    deliveryMethod === "Allegro International Kurier Czechy pobranie"
  ) {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (
    deliveryMethod === "Allegro International Automaty Paczkowe Czechy"
  ) {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (deliveryMethod === "Allegro International Kurier Czechy") {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (
    deliveryMethod === "Allegro International Automaty Paczkowe Czechy pobranie"
  ) {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (
    deliveryMethod === "Allegro International Odbiór w Punkcie Czechy pobranie"
  ) {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (
    deliveryMethod === "Allegro International Odbiór w Punkcie Czechy"
  ) {
    return await sendAllegroCourier(
      orderID,
      deliveryMethod,
      dimensions,
      cod,
      insurance
    );
  } else if (deliveryMethod === "Paczkomaty 24/7 - Przesyłka standardowa") {
    return await sendInpostPaczkomat(orderID, packageSize, cod, insurance);
  } else if (deliveryMethod === "Allegro Paczkomaty 24/7 InPost") {
    return await sendAllegroInpost(orderID, packageSize, cod, insurance);
  } else if (deliveryMethod === "Allegro miniKurier24 InPost") {
    return await sendAllegroInpost(orderID, packageSize, cod, insurance);
  } else if (deliveryMethod === "Allegro Kurier24 InPost") {
    return await sendAllegroInpost(orderID, packageSize, cod, insurance);
  } else if (deliveryMethod === "Przesyłka kurierska standardowa") {
    return await sendInpostCourier(orderID, dimensions, cod, insurance);
  } else {
    console.log("ERROR: NO METHOD IN CREATE PACKAGE");
    return {
      status: "ERROR",
      errorCode: "ERROR",
      errorMsg: "Nie znaleziono metody w CREATE PACKAGE",
    };
  }
}

async function sendAllegroInpost(orderID, packageSize, cod, insurance) {
  let fields = [];

  fields.push(
    { id: "service", value: "detect_new" },
    { id: "size_type", value: packageSize },
    { id: "insurance", value: insurance }
  );
  if (cod != "") {
    fields.push({ id: "cod", value: cod });
  }

  let params = {
    order_id: orderID,
    courier_code: "paczkomaty",
    fields: fields,
  };

  let data = {
    method: "createPackage",
    parameters: JSON.stringify(params),
  };
  var res = await axios.post("https://api.baselinker.com/connector.php", data, {
    headers: {
      "X-BLToken": process.env.BASELINKER_API_KEY,
      "Content-Type": "multipart/form-data",
    },
  });

  console.log("Create Package res: " + res.data);

  return res.data.status === "SUCCESS"
    ? {
        status: res.data.status,
        package: {
          package_id: res.data.package_id,
          courier_code: "paczkomaty",
          package_number: res.data.package_number,
          courier_package_nr: res.data.courier_inner_number,
        },
      }
    : {
        status: res.data.status,
        errorCode: res.data.error_code,
        errorMsg: res.data.error_message,
      };
}

async function sendInpostPaczkomat(orderID, packageSize, cod, insurance) {
  let fields = [];

  fields.push(
    { id: "service", value: "inpost_locker_standard" },
    { id: "size_type", value: packageSize },
    { id: "services_additional", value: "email" },
    { id: "insurance", value: insurance }
  );
  if (cod != "") {
    fields.push({ id: "cod", value: cod });
  }

  let params = {
    order_id: orderID,
    courier_code: "paczkomaty",
    fields: fields,
  };

  let data = {
    method: "createPackage",
    parameters: JSON.stringify(params),
  };
  var res = await axios.post("https://api.baselinker.com/connector.php", data, {
    headers: {
      "X-BLToken": process.env.BASELINKER_API_KEY,
      "Content-Type": "multipart/form-data",
    },
  });

  console.log("Create Package res: " + res.data);

  return res.data.status === "SUCCESS"
    ? {
        status: res.data.status,
        package: {
          package_id: res.data.package_id,
          courier_code: "paczkomaty",
          package_number: res.data.package_number,
          courier_package_nr: res.data.courier_inner_number,
        },
      }
    : {
        status: res.data.status,
        errorCode: res.data.error_code,
        errorMsg: res.data.error_message,
      };
}

async function sendInpostCourier(orderID, dimensions, cod, insurance) {
  let weight = dimensions.find((el) => el.dimension === "weight").value;
  let length = dimensions.find((el) => el.dimension === "weight").value;
  let width = dimensions.find((el) => el.dimension === "width").value;
  let height = dimensions.find((el) => el.dimension === "height").value;
  let fields = [];
  let package_fields = [];
  fields.push(
    { id: "service", value: "inpost_courier_standard" },
    { id: "package_description", value: orderID },
    { id: "services_additional", value: "email" },
    { id: "insurance", value: insurance }
  );
  if (cod != "") {
    fields.push({ id: "cod", value: cod });
  }

  package_fields = [
    {
      weight: weight,
      size_length: length,
      size_width: width,
      size_height: height,
      size_custom: 0,
    },
  ];

  let params = {
    order_id: orderID,
    courier_code: "inpostkurier",
    fields: fields,
    packages: package_fields,
  };

  let data = {
    method: "createPackage",
    parameters: JSON.stringify(params),
  };
  var res = await axios.post("https://api.baselinker.com/connector.php", data, {
    headers: {
      "X-BLToken": process.env.BASELINKER_API_KEY,
      "Content-Type": "multipart/form-data",
    },
  });

  console.log("Create Package res: " + res.data);

  return res.data.status === "SUCCESS"
    ? {
        status: res.data.status,
        package: {
          package_id: res.data.package_id,
          courier_code: "inpostkurier",
          package_number: res.data.package_number,
          courier_package_nr: res.data.courier_inner_number,
        },
      }
    : {
        status: res.data.status,
        errorCode: res.data.error_code,
        errorMsg: res.data.error_message,
      };
}

async function sendAllegroCourier(
  orderID,
  deliveryMethod,
  dimensions,
  cod,
  insurance
) {
  let weight = dimensions.find((el) => el.dimension === "weight").value;
  let length = dimensions.find((el) => el.dimension === "weight").value;
  let width = dimensions.find((el) => el.dimension === "width").value;
  let height = dimensions.find((el) => el.dimension === "height").value;

  let id = await getAllegroID(deliveryMethod);

  let fields = [];
  let package_fields = [];

  fields.push(
    { id: "courier", value: id },
    { id: "package_type", value: "PACKAGE" },
    { id: "package_description", value: orderID },
    { id: "reference_number", value: orderID },
    { id: "insurance", value: insurance }
  );
  if (cod != "") {
    fields.push({ id: "cod", value: cod });
  }
  package_fields.push(
    { weight: weight },
    { size_length: length },
    { size_width: width },
    { size_height: height }
  );

  let params = {
    order_id: orderID,
    courier_code: "allegrokurier",
    fields: fields,
    packages: package_fields,
  };

  let data = {
    method: "createPackage",
    parameters: JSON.stringify(params),
  };
  var res = await axios.post("https://api.baselinker.com/connector.php", data, {
    headers: {
      "X-BLToken": process.env.BASELINKER_API_KEY,
      "Content-Type": "multipart/form-data",
    },
  });

  console.log("Create Package res: " + res.data);

  return res.data.status === "SUCCESS"
    ? {
        status: res.data.status,
        package: {
          package_id: res.data.package_id,
          courier_code: "allegrokurier",
          package_number: res.data.package_number,
          courier_package_nr: res.data.courier_inner_number,
        },
      }
    : {
        status: res.data.status,
        errorCode: res.data.error_code,
        errorMsg: res.data.error_message,
      };
}

async function getAllegroID(deliveryMethod) {
  if (deliveryMethod === "Allegro DPD") {
    return "c3066682-97a3-42fe-9eb5-3beeccab840c";
  } else if (deliveryMethod === "Allegro UPS") {
    return "0e4c7d59-64b6-4b06-89c3-c1d941506dd0";
  } else if (deliveryMethod === "Allegro DPD z granicę") {
    return 11436059;
  } else if (deliveryMethod === "Allegro One Punkt (One Kurier)") {
    return "0ee3467f-5451-4060-856e-7a2b502abe55";
  } else if (deliveryMethod === "Allegro One Box (One Kurier)") {
    return "0b9bed2c-0bc1-4e1f-9694-29bb39ebb483";
  } else if (deliveryMethod === "Allegro International Kurier Czechy") {
    return "0c7805b4-1bcc-4dad-98c4-b3146fe9f54a";
  } else if (
    deliveryMethod === "Allegro International Kurier Czechy pobranie"
  ) {
    return "1401412f-1bcc-4dad-98c4-b3146fe9f54a";
  } else if (
    deliveryMethod === "Allegro International Automaty Paczkowe Czechy"
  ) {
    return "0e40225c-32c6-4602-b78f-b3146fe9f54a";
  } else if (
    deliveryMethod === "Allegro International Automaty Paczkowe Czechy pobranie"
  ) {
    return "191819e3-32c6-4602-b78f-b3146fe9f54a";
  } else if (
    deliveryMethod === "Allegro International Odbiór w Punkcie Czechy pobranie"
  ) {
    return "1037d74a-2043-4ed0-aff7-b3146fe9f54a";
  } else if (
    deliveryMethod === "Allegro International Odbiór w Punkcie Czechy"
  ) {
    return "0af0a4e4-2043-4ed0-aff7-b3146fe9f54a";
  } else return -1;
}

async function removePackage(courier_code, package_id, package_number) {
  console.log(
    "Remove package data: " + courier_code,
    package_number,
    package_id
  );

  let params = {
    courier_code: courier_code,
    package_id: package_id,
    package_number: package_number,
  };

  let data = {
    method: "deleteCourierPackage",
    parameters: JSON.stringify(params),
  };

  res = await axios.post("https://api.baselinker.com/connector.php", data, {
    headers: {
      "X-BLToken": process.env.BASELINKER_API_KEY,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.status === "SUCCESS"
    ? { status: res.data.status }
    : {
        status: res.data.status,
        errorCode: res.data.error_code,
        errorMsg: res.data.error_message,
      };
}
async function markOrderWithStar(orderID) {
  let params = {
    order_id: orderID,
    extra_field_1: "api",
  };

  let data = {
    method: "setOrderFields",
    parameters: JSON.stringify(params),
  };
  await axios.post("https://api.baselinker.com/connector.php", data, {
    headers: {
      "X-BLToken": process.env.BASELINKER_API_KEY,
      "Content-Type": "multipart/form-data",
    },
  });
}

async function unmarkOrderWithStar(orderID) {
  let params = {
    order_id: orderID,
    extra_field_1: "",
  };

  let data = {
    method: "setOrderFields",
    parameters: JSON.stringify(params),
  };
  await axios.post("https://api.baselinker.com/connector.php", data, {
    headers: {
      "X-BLToken": process.env.BASELINKER_API_KEY,
      "Content-Type": "multipart/form-data",
    },
  });
}

async function sendEmail(emailTopic, emailContent, emailAdresses, labels) {
  let attachments = [];

  labels.forEach((element) => {
    let x = new Object();
    x.filename = element;
    x.path = "./" + element;
    attachments.push(x);
  });

  console.log(attachments);

  var mail = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "kontaktkubartech@gmail.com",
      pass: "xgkydtemmbbnnotd",
    },
  });

  emailAdresses.push("andrysiakmaciejj@gmail.com");
  var maillist = emailAdresses;

  try {
    var mailOptions = {
      from: "kontaktkubartech@gmail.com",
      to: maillist,
      subject: emailTopic,
      text: emailContent,
      attachments: attachments,
    };

    var x = await mail.sendMail(mailOptions);

    return { status: "success" };
  } catch (error) {
    console.log(error);
    return { status: "error" };
  }
}

function prepEmailContent(order_source) {
  let string = "\n\n\nLISTA WYSYŁKOWA\n";

  for (let i = 0; i < order_source.orders[0].products.length; i++) {
    let index = i + 1;
    string =
      string +
      "\n" +
      index +
      ". " +
      order_source.orders[0].products[i].name +
      ", EAN: " +
      order_source.orders[0].products[i].ean +
      ", ILOŚĆ: " +
      order_source.orders[0].products[i].quantity;
  }
  return string;
}
async function getLabels(labelNumbers) {
  let resposes = [];

  for (let element of labelNumbers) {
    let courierCode = element.courier_code;
    let package_id = element.package_id;
    let package_number = element.package_number;

    let res = await getLabel(courierCode, package_id, package_number);
    if (res === "ERROR") {
      return "ERROR";
    }
    resposes.push(res);
  }

  if (resposes.some((e) => e === "fail")) {
    return "fail";
  } else {
    return resposes;
  }
}
async function getLabel(courierCode, package_id, package_number) {
  let params = {
    courier_code: courierCode,
    package_id: package_id,
    package_number: package_number,
  };

  console.log("stats", courierCode, package_id, package_number);

  let data = {
    method: "getLabel",
    parameters: JSON.stringify(params),
  };
  let res = await axios.post("https://api.baselinker.com/connector.php", data, {
    headers: {
      "X-BLToken": process.env.BASELINKER_API_KEY,
      "Content-Type": "multipart/form-data",
    },
  });

  if (res.data.status === "ERROR") return "ERROR";

  return await saveBase64toPdf(res.data.label, package_id);
}

async function saveBase64toPdf(base64code, filename) {
  let finalFilename = "Label" + filename + ".pdf";

  await fs.writeFile(finalFilename, base64code, "base64", (error) => {
    if (error) {
      return "fail";
    } else {
      return finalFilename;
    }
  });

  return finalFilename;
}

async function moveOrderToProperCategory(orderID, orderSource) {
  let statusID = getCategoryStatus(orderSource);

  let params = {
    order_id: orderID,
    status_id: statusID,
  };

  let data = {
    method: "setOrderStatus",
    parameters: JSON.stringify(params),
  };
  let info = await axios.post(
    "https://api.baselinker.com/connector.php",
    data,
    {
      headers: {
        "X-BLToken": process.env.BASELINKER_API_KEY,
        "Content-Type": "multipart/form-data",
      },
    }
  );
}

function getCategoryStatus(orderSource) {
  return sourceToCategoryArray[orderSource];
}
const sourceToCategoryArray = {
  allegro: 161878,
  shopee: 173349,
  empik: 193321,
  morele: 194350,
  ceneo: 239827,
};

module.exports = router;
