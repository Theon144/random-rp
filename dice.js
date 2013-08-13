/* This code first converts the dice roll to a mathematical expression in RPN, using
   the Dijkstra's shunting-yard algorithm (basically copied line by line from wikipedia),
   treating "d" as just another mathematical operator.

   I wanted a solution that would work no matter the dice rolls' complexity, and I didn't
   like to sanitize the input and then just using "eval()". I feel like this is not very
   ideal though, so if you have a better solution in mind, do contact me :)
*/

function randomInt(value){
  return (Math.floor(Math.random()*value)+1);
}

var isoperator = /^[+\-*/df]$/;

function to_rpn (expression){
  var operatorPrecedence = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "d": 3,
    "f": 3,
  };

  var output = [];
  var stack = [];
  
  while ( expression.length > 0 ){
    var token = expression.shift();
    if ( token == parseInt(token) ){
      output.push(parseInt(token));
      continue;
    }
 
    if ( isoperator.test(token) ){
      while ( isoperator.test(stack[stack.length-1]) &&
              operatorPrecedence[token] <= operatorPrecedence[stack[stack.length-1]]
            ){
        output.push(stack.pop());
      }
      
      stack.push(token);
      continue;
    }
    
    if ( token == '(' ){
      stack.push(token);
      continue;
    }
    
    if ( token == ')' ){
      while ( stack[stack.length-1] != '(' ){
        output.push(stack.pop());
        if ( stack.length == 0 ){
          return { err: "Mismatched parentheses." };
        }
      }
      
      stack.pop(stack.length-1);
      
    }
  }
  
  while ( stack.length > 0 ){
    if ( stack[stack.length-1] == '(' || stack[stack.length-1] == ')' ){
      return { err: "Mismatched parentheses" };
    }
    output.push(stack.pop());
  }
  
  return output;
}



function evaluate (expression){
  var stack = [];
  var rolls = [];
  
  while ( expression.length > 0 ){
    var token = expression.shift();
    
    if (token == parseInt(token)){
      stack.push(token);
    } else {
      if ( stack.length < 2 ){
        return { err: "Invalid expression: Wrong amount of operators/operands" };
      } else {
        var secondOperand = stack.pop();
        var firstOperand = stack.pop();
      }
      
      switch (token){
        case "+":
          stack.push(firstOperand + secondOperand);
          break;
        case "-":
          stack.push(firstOperand - secondOperand);
          break;
        case "*":
          stack.push(firstOperand * secondOperand);
          break;
        case "/":
          if ( secondOperand == 0 ){
            return { err: "Division by zero" };
          } else {
            stack.push(firstOperand / secondOperand);
          }
          break;
        case "d":
          if ( firstOperand > 1000 || secondOperand > 10000 ){
            return {err: "Dice roll values too high" };
          }

          var total = 0;
          var i = 0;
          while (i < firstOperand){
            var roll = randomInt(secondOperand);
            rolls.push(roll);
            total += roll;
            i += 1;
          }
          stack.push(total);
          break;
        case "f":
          if ( firstOperand > 100 ){
            return {err: "Dice roll values too high" };
          }
          
          var total = 0;
          var i = 0;
          while (i < firstOperand){
            switch (randomInt(3)-2){
              case -1:
                rolls.push('-');
                total -= 1;
                break;
              case 0:
                rolls.push('_');
                break;
              case 1:
                rolls.push('+');
                total += 1;
                break;
            }
            i += 1;
          }
          stack.push(total);
          break;
        default:
          return {err: "Invalid expression: Invalid token" };
      }
    }
  }
  if ( stack.length == 1 ){
    return {
      result: parseInt(stack),
      rolls: rolls
    };
  } else {
    return { err: "Invalid expression: Wrong amount of operators/operands" };
  }
}

function roll(string){
  string = string.replace('dF', 'f0');
  expression = string.match(/([0-9]+|[*/+\-df()])/g);
  if (string != expression.join('')){
    return {
      err: "Invalid expression: Invalid character"
    }
  }
  expression = to_rpn(expression);
  if ( expression.err ){
    return expression;
  }
  return evaluate(expression);
}

exports.roll = roll;
