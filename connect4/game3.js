	
	var PAD = 12;
	var WIDTH = 7;
	var HEIGHT = 6;
	var DISC_SIZE = 36;
	var TURN_VALUE_DIMINISH = 0.8;
	var MAX_MOVE_DEPTH = 3;//2;
	var JOIN_VALUE = 0.4;
	var origW = 350;
	var origH = 300;
	var containAll;
	var canvas;			//Main canvas
	var stage;			//Main display stage
	var discLayer;
	var messageLayer;
	var whoseTurn;
	var whoStarts;
	var IN_PLAY = 0;
	var GAME_OVER = 1;
	var gameState;
	var startX;
	var startY;
	var gridArr;
	var lastRow;
	var lastCol;
	var messageShowing = false;
	var messageText;
	var scaleAll;
	var tickWait = 0;
	var debugLayer;
	var bp;
	var board;
	var animDisc;
	var animTo;
	var animSpeed;
	var animating = false;
	var MAX_FALL_SPEED = 100;
	var FALL_ACC = 4;
	var thinking;

	//register key functions
	//document.onkeydown = handleKeyDown;
	//document.onkeyup = handleKeyUp;

	function init() {
		//var queue = new createjs.LoadQueue(true, null, true);
		canvas = document.getElementById("gameCanvas");
		canvas.width = document.body.clientWidth; //document.width is obsolete
		canvas.height = document.body.clientHeight; //document.height is obsolete
		scaleAll = Math.min(canvas.width/origW, canvas.height/origH);
		canvas.style.backgroundColor = "#FFFFFF";
		stage = new createjs.Stage(canvas);
		//stage.on("stagemousedown", handleClick);
		//debugLayer = new createjs.Container();
		containAll = new createjs.Container();
		containAll.addEventListener("click", handleClick);
		containAll.scaleX = containAll.scaleY = scaleAll;
		containAll.x = canvas.width/2 - origW*scaleAll/2;
		//start game timer
		if (!createjs.Ticker.hasEventListener("tick")) {
			createjs.Ticker.addEventListener("tick", tick);
		}
		
		board = new createjs.Container();
		bp = new Image();
		bp.src = "img/board.png";
		bp.onload = handleBoardLoad;
	  
		
		//var boardMask = new createjs.Shape();
		startX = origW/2 - WIDTH/2*(DISC_SIZE + PAD) + (DISC_SIZE + PAD)/2;
		startY = origH - DISC_SIZE/2 - PAD;
		/* for(iW = 0; iW < WIDTH; iW++)
		{
			for(iH = 0; iH < HEIGHT; iH++)
			{
				boardMask.graphics.beginFill("white");
				boardMask.graphics.drawCircle(startX + iW*(DISC_SIZE + PAD), startY - iH*(DISC_SIZE + PAD), DISC_SIZE/2);
				boardMask.graphics.endFill();
			}
		} */
		discLayer = new createjs.Container();
		
		thinking = new createjs.Container();
		thinking.visible = false;
		thinking.x = origW/2;
		thinking.y = origH/2;
		var messageBg = new createjs.Shape();
		var msgW = 200;
		var msgH = 40;
		messageBg.graphics.beginFill("black");
		messageBg.graphics.drawRect(-msgW/2,-msgH/2,msgW,msgH);
		messageBg.alpha = 0.8;
		messageText = new createjs.Text("thinking", "20px Arial", "#FFFFFF");
		messageText.textAlign = "center";
		messageText.y = - 12;
		thinking.addChild(messageBg, messageText);
		
		messageLayer = new createjs.Container();
		messageLayer.visible = false;
		messageLayer.x = origW/2;
		messageLayer.y = origH/2;
		var messageBg = new createjs.Shape();
		var msgW = 200;
		var msgH = 40;
		messageBg.graphics.beginFill("black");
		messageBg.graphics.drawRect(-msgW/2,-msgH/2,msgW,msgH);
		messageBg.alpha = 0.8;
		messageText = new createjs.Text("message", "20px Arial", "#FFFFFF");
		messageText.textAlign = "center";
		messageText.y = - 12;
		var xBtn = new createjs.Shape();
		xBtn.alpha = 0.8;
		xBtn.graphics.beginFill("black");
		xBtn.graphics.beginStroke("white");
		xBtn.graphics.setStrokeStyle(3, "round");
		xBtn.graphics.drawCircle(0,0,14);
		var r = 5;
		xBtn.graphics.moveTo(-r,-r);
		xBtn.graphics.lineTo(r,r);
		xBtn.graphics.moveTo(r,-r);
		xBtn.graphics.lineTo(-r,r);
		xBtn.x = msgW/2;
		xBtn.y = -msgH/2;
		messageLayer.addChild(messageBg, messageText, xBtn);
		containAll.addChild(discLayer, board, messageLayer, thinking);
		stage.addChild(containAll);
		gridArr = [];
		whoStarts = 0;
		reset();
		showMessage("Your turn.");
		stage.update();
	}
	
	function handleBoardLoad()
	{
		for(iW = 0; iW < WIDTH; iW++)
		{
			for(iH = 0; iH < HEIGHT; iH++)
			{
				var bitmap = new createjs.Bitmap(bp);
				bitmap.x = startX + iW*(DISC_SIZE + PAD) - (DISC_SIZE + PAD)/2;
				bitmap.y = startY - iH*(DISC_SIZE + PAD) - (DISC_SIZE + PAD)/2;
				board.addChild(bitmap);
			}
		}
		var boardTouch = new createjs.Shape();
		boardTouch.graphics.beginFill("white");
		boardTouch.graphics.drawRect(0,0,origW,origH);
		boardTouch.alpha = 0.01;
		board.addChild(boardTouch);
		
		stage.update();
	}
	
	function showMessage(msg)
	{
		messageShowing = true;
		messageText.text = msg;
		messageLayer.visible = true;
		stage.update();
	}
	
	function reset()
	{
		whoseTurn = whoStarts;
		whoStarts = (whoStarts+1)%2;
		discLayer.removeAllChildren();
		gameState = IN_PLAY;
		
		for(i = 0; i < WIDTH*HEIGHT; i++)
		{
			gridArr[i] = -1;
		}
		
		stage.update();
		
		if(whoseTurn == 1)
		{
			doAiTurn();
			whoseTurn = 0; 
		}
	}

	function handleClick(e) {
		if(messageShowing)
		{
			messageLayer.visible = false;
			messageShowing = false;
			if(gameState == GAME_OVER)
			{
				reset();
			}
		}
		else if(gameState == IN_PLAY && whoseTurn == 0 && !animating)
		{
			var col = Math.round((e.localX-startX) / (DISC_SIZE + PAD));
			if(col >= 0 && col < WIDTH)
			{
				var row = 0;
				while(row < HEIGHT)
				{
					if(gridArr[row * WIDTH + col] == -1)
					{
						break;
					}
					row++;
				}
				if(row == HEIGHT) return;
				
				doDisc(0,col,row);
				
				var b = analyseBoard();
				/* console.log("board values, 0:", b.playerValueArr[0], "and 1:", b.playerValueArr[1]);
				var chains = b.chains[0];
				for(var i = 0; i < chains.length; i++)
				{
					console.log("dir:", chains[i].dir, "len:", chains[i].len, "val:", chains[i].value);
				} */
				
				var win = b.winInd;//checkWin();
				if(win == 0)
				{
					gameState = GAME_OVER;
					showMessage("Big Dog!");
				}
				else
				{
					//thinking.visible = true;
					tickWait = 2;
				}
			}
		}
		stage.update();
	}
	
	function doAiTurn()
	{
		whoseTurn = 1;
		var saveGrid = copyArray(gridArr, WIDTH*HEIGHT);
		//debugInt = 0;
		var bean = makeBestMove(0);
		setArray(gridArr, saveGrid, WIDTH*HEIGHT);
		doDisc(1,lastCol,lastRow);
		return bean;
		//if(bean.debug)debugLayer.addChild(bean.debug);
	}
	
	function setArray(destArr, sourceArr, length)
	{
		for(var i = 0; i < length; i++)
		{
			destArr[i] = sourceArr[i];
		}
	}
	
	function copyArray(inArr, length)
	{
		var newArr = [];
		for(var i = 0; i < length; i++)
		{
			newArr[i] = inArr[i];
		}
		return newArr;
	}
	
	function updateDraw()
	{
		discLayer.removeAllChildren();
		for(var iW = 0; iW < WIDTH; iW++)
		{
			for(var iH = 0; iH < HEIGHT; iH++)
			{
				var gridInt = gridArr[iH*WIDTH + iW];
				if(gridInt!=-1)
				{
					doDisc(gridInt, iW, iH);
				}
			}
		}
		stage.update();
	}
	
	/* function checkWin()
	{
		for(var iPlayer = 0; iPlayer < 2; iPlayer++)
		{
			for(var col = 0; col < WIDTH; col++)
			{
				for(var row = 0; row < HEIGHT; row++)
				{
					if(gridArr[row*WIDTH+col] == iPlayer)
					{
						var rightChain = true;
						var upChain = true;
						var upRightChain = true;
						var upLeftChain = true;
						
						for(var j = 1; j < 4; j++)
						{
							if(rightChain)
							{
								if(getGrid(col + j, row) != iPlayer)
								{
									rightChain = false;
								}
							}
							if(upChain)
							{
								if(getGrid(col, row + j) != iPlayer)
								{
									upChain = false;
								}
							}
							if(upRightChain)
							{
								if(getGrid(col + j, row + j) != iPlayer)
								{
									upRightChain = false;
								}
							}
							if(upLeftChain)
							{
								if(getGrid(col - j, row + j) != iPlayer)
								{
									upLeftChain = false;
								}
							}
							if(rightChain || upChain || upRightChain || upLeftChain)
							{
								if(j == 3)
								{
									return iPlayer;
								}
							}
							else
							{
								break;
							}
						}
					}
				}
			}
		}
		return -1;
	} */
	
	function makeBestMove(moveDepth)
	{
		var saveGrid = copyArray(gridArr, WIDTH*HEIGHT);
		var freeColumn = false;
		var maxBeans = [];
		var maxColValue = -9999;
		var maxColColInd;
		var maxColRowInd;
		var maxColBoardValueBean;
		var maxColEndWin;
		for(var dropCol = 0; dropCol < WIDTH; dropCol++)
		{
			var dropRow = 0;
			while(dropRow < HEIGHT && gridArr[dropRow * WIDTH + dropCol] != -1)
			{
				dropRow++;
			}
			if(dropRow < HEIGHT)
			{
				freeColumn = true;
				var endWin = false;
				//var colValueArr = [0,0];
				gridArr[dropRow*WIDTH + dropCol] = whoseTurn;
				var boardValueBean = analyseBoard();
				if(boardValueBean.winInd >= 0) endWin = true;
				if(moveDepth < MAX_MOVE_DEPTH && !endWin)
				{
					var saveWhoseTurn = whoseTurn;
					whoseTurn = (whoseTurn+1)%2;
					var nextTurnBean = makeBestMove(moveDepth+1);
					boardValueBean.playerValueArr = nextTurnBean.playerValueArr;
					//colValueArr = ;
					//boardValueBean = makeBestMove(moveDepth+1);
					//colValueArr[0] = nextTurnBean.playerValueArr[0] - boardValueBean.playerValueArr[0];
					//colValueArr[1] = nextTurnBean.playerValueArr[1] - boardValueBean.playerValueArr[1];
					//boardValueBean = makeBestMove(moveDepth+1);
					boardValueBean.playerValueArr[0]*=TURN_VALUE_DIMINISH;
					boardValueBean.playerValueArr[1]*=TURN_VALUE_DIMINISH;
					//colValueArr = [boardValueBean.playerValueArr[0]*TURN_VALUE_DIMINISH, boardValueBean.playerValueArr[1]*TURN_VALUE_DIMINISH];
					//colValueArr[0] = boardValueBean.playerValueArr[0] + nextTurnBean.playerValueArr[0]*TURN_VALUE_DIMINISH;
					//colValueArr[1] = boardValueBean.playerValueArr[1] + nextTurnBean.playerValueArr[1]*TURN_VALUE_DIMINISH;
					whoseTurn = saveWhoseTurn;
				}
				 /* else
				{
					colValueArr = boardValueBean.playerValueArr;
				} */
				
				//evaluate drop-column value
				var colValue = boardValueBean.playerValueArr[whoseTurn] - boardValueBean.playerValueArr[(whoseTurn+1)%2];
				//var colValue = colValueArr[whoseTurn] - colValueArr[(whoseTurn+1)%2];
				/* if(moveDepth == 0)
				{
					console.log("drop", dropCol, "val: ", colValue);
				} */
				if(colValue > maxColValue || Math.abs(colValue - maxColValue) < JOIN_VALUE)
				{
					var bean = {
						value:colValue,
						colInd:dropCol,
						rowInd:dropRow,
						boardValueBean:boardValueBean
					};
						
					if(colValue > maxColValue + JOIN_VALUE)
					{
						maxBeans = [bean];
					} 
					else
					{
						maxBeans.push(bean);
					}
					maxColValue = colValue;
				}
				
				
				//reset grid
				setArray(gridArr, saveGrid, WIDTH*HEIGHT);
			}
		}
		
		if(freeColumn)
		{
			//if(moveDepth == 0)console.log("max beans: ", maxBeans.length);
			var maxBean = maxBeans[Math.floor(Math.random()*maxBeans.length)];
			gridArr[maxBean.rowInd*WIDTH + maxBean.colInd] = whoseTurn;
			lastRow = maxBean.rowInd;
			lastCol = maxBean.colInd;
			/* if(moveDepth == 1 && whoseTurn == 0)
			{
				//debugLayer.removeAllChildren();
				console.log("value at col", maxColColInd, "row", maxColRowInd, "is", maxColValue, "after dropping in", (debugInt+1));
				var c = new createjs.Container();
				var t = new createjs.Text(maxColValue, "6px Arial", "#000000");
				var t2 = new createjs.Text(debugInt, "8px Arial", "#000000");
				t2.y = -10;
				debugInt++;
				t.textAlign="center";
				t2.textAlign="center";
				var s = new createjs.Shape();
				s.graphics.beginStroke("black");
				s.graphics.drawCircle(0,0,10);
				c.x = startX + maxColColInd*(DISC_SIZE + PAD);
				c.y = startY - maxColRowInd*(DISC_SIZE + PAD);
				c.addChild(s);
				c.addChild(t);
				c.addChild(t2);
				debugLayer.addChild(c);
			} */
			return maxBean.boardValueBean;
		}
		else
		{
			return analyseBoard();
		}
	}
	
	function analyseBoard()
	{
		var returnBean = {playerValueArr:[0,0], winInd:-1};
		for(var iDir = 0; iDir < 4; iDir++)
		{
			for(var iBase = 0; iBase < 12; iBase++)
			{
				var chainArr = [];
				for(var iRun = 0; iRun < 7; iRun++)
				{
					var col;
					var row;
					switch(iDir)
					{
						case 0:
							//vertical
							col = iBase;
							row = iRun;
							break;
						case 1:
							//horizontal
							col = iRun;
							row = iBase;
							break;
						case 2:
							//diagonal left down to right
							if(iBase < 6)
							{
								col = iRun;
								row = iBase-iRun;
							}
							else
							{
								col = iBase - 6 + iRun;
								row = HEIGHT-iRun;
							}
							break;
						case 3:
							//diagonal right down to left
							if(iBase < 6)
							{
								col = WIDTH - iRun;
								row = iBase-iRun;
							}
							else
							{
								col = WIDTH - (iBase-6) - iRun;
								row = HEIGHT-iRun;
							}
							break;
					}
					var cell = getGrid(col, row);
					if(cell!=-2)//not out of grid
					{
						for(var iChain = 0; iChain < chainArr.length; iChain++)
						{
							var chain = chainArr[iChain];
							if(chain.len < 4)
							{
								if(chain.owner == cell || chain.owner == -1 || cell == -1)
								{
									chain.len ++;
									if(cell != -1)
									{
										chain.owner = cell;
										chain.value++;
									}
								}
								else
								{
									//hit enemy, break chain
									chainArr.splice(iChain, 1);
									iChain--;
								}
							}
						}
						//var newChain = {owner:cell, len:1, dir:iDir, value:((cell==-1)?0:1)};
						var newChain = {owner:cell, len:1, value:((cell==-1)?0:1)};
						chainArr.push(newChain);
					}
				}
				for(var iChain = 0; iChain < chainArr.length; iChain++)
				{
					var chain = chainArr[iChain];
					if(chain.owner != -1)
					{
						if(chain.len == 4)
						{
							//returnBean.chains[chain.owner].push(chain);
							returnBean.playerValueArr[chain.owner] += (chain.value*chain.value)*(chain.value/4);
							if(chain.value == 4)
							{
								returnBean.playerValueArr[chain.owner] = 999;
								returnBean.winInd = chain.owner;
							}
						}
					}
					
				}
			}
		}
		return returnBean;
	}
	
	function doDisc(player, col, row)
	{
		var disc = new createjs.Shape();
		disc.graphics.beginFill(((player == 0)?"yellow":"red"));
		disc.graphics.drawCircle(0,0,DISC_SIZE/2);
		discLayer.addChild(disc);
		
		disc.x = startX + col * (DISC_SIZE + PAD);
		disc.y = -DISC_SIZE;
		animTo = startY - row * (DISC_SIZE + PAD);
		
		gridArr[row*WIDTH + col] = player;
		
		animating = true;
		animDisc = disc;
		animSpeed = 0;
	}
	
	function processValue(chainLength,runningValue,maxAdjacent)
	{
		return (chainLength * (runningValue/chainLength))/5 + runningValue + ((maxAdjacent>=2)?5:0);
	}
	
	function getGrid(col, row)
	{
		if(col < 0 || row < 0 || col >= WIDTH || row >= HEIGHT) return -2;
		return gridArr[row*WIDTH + col];
	}
	
	/* function getGridOld(ind)
	{
		if(ind < 0) return -2;
		if(ind >= WIDTH*HEIGHT) return -2;
		return gridArr[ind];
	} */
	
	/* function getValue(playerInd, gridInd)
	{
		var grid = getGrid(gridInd);
		if(grid == -2) return -1;
		if(grid == playerInd) return 1;
		if(grid == -1) return 0;
		return -1;
	} */

	function tick(event) {
		if(animating)
		{
			animSpeed += FALL_ACC;
			if(animSpeed > MAX_FALL_SPEED) animSpeed = MAX_FALL_SPEED;
			animDisc.y += animSpeed;
			if(animDisc.y > animTo)
			{
				animDisc.y = animTo;
				animating = false;
			}
			stage.update();
		}
		else if(tickWait > 0)
		{
			tickWait--;
			if(tickWait <= 0)
			{
				thinking.visible = false;
				var bean = doAiTurn();
				if(bean.winInd == 1)
				{
					gameState = GAME_OVER;
					showMessage("You're shit.");
				}
				else
				{
					whoseTurn = 0; 
				} 
			}
		}
		//stage.update(event);
	}