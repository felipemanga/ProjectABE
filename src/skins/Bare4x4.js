module.exports = {
    
    width: 128,
    height: 64,
    remap: false,

    elements:{
	
	"#bg":{
	    "src":"",
	    "style.display":"none"
	},

	"#screen":{
	    style:`
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 256px;
    width: 512px;
    margin: auto;
    background: black;
`
	}	
	
    }
    
};
