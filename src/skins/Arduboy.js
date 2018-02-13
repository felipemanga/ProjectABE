module.exports = {
    
    width: 626,
    height: 1004,
    remap: false,
    
    elements:{
	
	"#bg":{
	    "src":"Arduboy (" + Math.floor(Math.random()*10) + ").png"
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

	"#Up":{
	    style:{
		top: "49%",
		left: "16%",
		width: "14%",
		height: "10%"
	    }
	},
	
	"#Left":{
	    style:{
		top: "57%",
		left: "2%",
		width: "15%",
		height: "9%"
	    }
	},

	"#Down":{
	    style:{
		top: "65%",
		left: "16%",
		width: "14%",
		height: "10%"
	    }
	},
	"#Right":{
	    style:{
		top: "58%",
		left: "28%",
		width: "15%",
		height: "9%"
	    }
	},
	"#A":{
	    style:{
		top: "59%",
		left: "64%",
		width: "14%",
		height: "8%",
		borderRadius: "50%"
	    }
	},
	"#B":{
	    style:{
		top: "54%",
		left: "79%",
		width: "15%",
		height: "9%",
		borderRadius: "50%"
	    }
	},
	"#PWR":{
	    style:{
		width: "14%",
		height: "7%",
		top: 0,
		left: "15%"
	    }
	},
	"#MCM":{
	    style:{
		width: "6%",
		height: "9%",
		top: "25%",
		left: "89%"
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
	},
	"#RESET":{
	    style:{
		width: "7%",
		height: "4%",
		bottom: "3%",
		left: "20%"
	    }
	},	
	
    }
    
};
