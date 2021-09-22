const { request, response } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

const customers = [];

app.use(express.json());

//Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found" });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acumulator, operation) =>{
        if(operation.type === 'credit') {
            return acumulator + operation.amount;
        }else {
            return acc -operation.amount;
        }
    }, 0);
    return balance;
}

/**
 * cpf- string
 * name - string
 * id - uuid -  universally unique identifier
 * statement - []
 */
app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customers) => customers.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({
      error: "Customer already exists!",
    });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });
  return response.status(201).send();
});

//app.use(verifyIfExistsAccountCPF);

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return response.status(400).json({ error: "Insufficient funds!" });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
      };
    
      customer.statement.push(statementOperation);
    
      return response.status(201).send();
})

app.listen(3333);
