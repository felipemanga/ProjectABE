module.exports = {
    
    width: 1352,
    height: 917,
    remap: false,
    CRTFade: true,
    background: "black",
    
    elements:{
	
	"#bg":{
	    "src":"Pipboy3000.jpg",
	    "style":"mix-blend-mode: screen"
	},

	"#screen":{
	    style:`
    top: 23.7%;
    height: 30.25%;
    left: 33%;
    width: 41%;
    filter: sepia(100%) hue-rotate(12deg) saturate(100);
`
	},
	
	"led.tx":{
	    style:{
		top: "85%",
		left: "22%",
		width: "4%"
	    }
	},
	
	"led.rx":{
	    style:{
		top: "85%",
		left: "19%",
		width: "4%"
	    }
	},
	
	"#ABM":{
	    style:{
		width: "15%",
		height: "9%",
		top: "84%",
		left: "19%",
		display: "none"
	    }
	},
	"#DBG":{
	    style:{
		width: "21%",
		height: "10%",
		bottom: 0,
		left: "41%"
	    }
	}	
    }
    
};
