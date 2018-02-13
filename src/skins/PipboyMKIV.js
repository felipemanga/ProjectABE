module.exports = {
    
    width: 1380,
    height: 1047,
    remap: false,
    CRTFade: true,
    background: "black",
    
    elements:{
	
	"#bg":{
	    "src":"Pipboy3000_MarkIV.jpg",
	    "style":"mix-blend-mode: screen"
	},

	"#screen":{
	    style:`
    top: 26%;
    height: 22.92%;
    left: 22%;
    width: 35%;
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
