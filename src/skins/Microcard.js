module.exports = {
    
    width: 91,
    height: 57,
    remap: true,
    
    elements:{
	"#bg":{
	    "src":"mc.png",
	    "dataset.pixelated":"true"
	},

	"#screen": {
	    style:{
		"top": "34%",
		"height": "30.13%",
		"width": "38%",
		"left": "30.5%",
		"transform": "rotate(-90deg)"
	    }
	},

	"#Right": {
	    style:{
		"top": "20%",
		"left": "16%",
		"width": "9%",
		"height": "14%"
	    }
	},

	"#Left": {
	    style:{
		"top": "46%",
		"left": "16%",
		"width": "9%",
		"height": "14%"
	    }
	},

	"#Up": {
	    style:{
		"top": "31%",
		"width": "10%",
		"left": "7%",
		"height": "16%"
	    }
	},

	"#Down": {
	    style:{
		"top": "31%",
		"width": "10%",
		"left": "24%",
		"height": "16%"
	    }
	},

	"#A": {
	    style:{
		"top": "38%",
		"width": "9%",
		"left": "72%",
		"height": "15%"
	    }
	},

	"#B": {
	    style:{
		"top": "28%",
		"width": "9%",
		"left": "82%",
		"height": "15%"
	    }
	},

	"#PWR": {
	    style:{
		"left": "18%",
		"height": "14%"
	    }
	},

	"#MCM": {
	    style:{
		"display": "none"
	    }
	},

	"#ABM": {
	    style:{
		display: "block",
		width: "10%",
		height: "12%",
		bottom: "2%",
		left: "22%"
	    }
	},

	"#DBG": {
	    style:{
		"width": "11%",
		"left": "44%",
		"height": "14%"
	    }
	},

	"#RESET": {
	    style:{
		"width": "7%",
		"height": "10%",
		"top": "2%",
		"left": "71%"
	    }
	}
	
    }
    
};

