// let {bind, inject, getInstanceOf} = require('dry-di');
let {bind, inject, getInstanceOf} = require('./lib/dry-di.js');


// create an IFood class to serve as an Interface
class IFood{
    eat(){ throw "Interface" };
}

// Doritos may not really be food (does not extend IFood). 
// But it sure does look like food... so good enough.
class Doritos{
    eat(){
        console.log("eating doritos");
    }
}

// Believe it or not, Cabbage actually is food!
class Cabbage extends IFood {

    static "@inject" = {
        color:"IColor"
    };

    eat(){
        console.log("eating " + this.color + " cabbage");
    }
}
// inject({
//     color:"Color"
// }).into(Cabbage);

// Create a Mouth for the eating of IFood.
class Mouth{

    constructor(){
        
        console.log("I haz " + this.multiFood.length + " foods!");
        console.log("Only " + this.multiTastyFood.length + " of them are tasty, though!");
        
        // food is an injected property.
        this.food.eat(); // eat any kind of food

        this.healthyFood.eat(); // eat cabbage

    }

    again(){
        console.log("eating some more...");
        this.food.eat();
    }

}

// Mouths require things that look like IFood.
// IFood-like things go in the "food" property.
inject({ 
    food:IFood, // inject IFood, regardless of tags
    healthyFood:[IFood, {healthy:true}], // inject IFood tagged healthy
    multiFood:[IFood, []], // inject an array of all the IFoods
    multiTastyFood:[IFood, [], {tasty:true}] // inject an array of all the tasty IFoods
}).into( Mouth ); 

// register Doritos as a kind of IFood.
bind(Doritos).to(IFood);

// register Cabbage as healthy IFood.
bind(Cabbage)
    .to(IFood)
    .withTags({
        tasty:false,
        healthy:true
    })
    .injecting(
        ["purple", "IColor"]
    );

// register Mouth as a singleton called "main".
bind(Mouth).to("main").singleton(); 

// Create a Mouth
// Create Doritos
// Inject doritos into mouth.
// Call the Mouth constructor.
// Return mouth
let mouth = getInstanceOf("main"); // HERE BE MAGIC!         

// Mouth is a singleton, so don't create a new one.
// Just get the previous one, instead.
// Then eat some more!
getInstanceOf("main").again();

