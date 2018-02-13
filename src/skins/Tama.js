module.exports = {
    
    width: 686,
    height: 816,
    remap: false,
    background: "white",

    elements:{
	
	"#bg":{
	    "src":"tama" + Math.floor(Math.random()*3) + ".jpg"
	},

	"#screen":{
	    style:`
    top: 39.7%;
    height: 17.653%;
    left: 29%;
    width: 42%;
    filter: invert(100%) contrast(85%);
`
	}	
	
    }
    
};
