angular.module("webapp").controller("TXController", ["$scope", "$timeout", "$interval", "$location", "TXService", TXController]);
angular.module("webapp").controller("SearchTXController", ["$scope", "$location", "TXService", SearchTXController]);
angular.module("webapp").controller("UnconfirmedTXController", ["$scope", "$timeout", "$interval", "$location", "TXService", UnconfirmedTXController]);
angular.module("webapp").controller('graphController', ["$scope", "$location","TXService", graphController]);
angular.module("webapp").controller("FeeCalculatorController", ["$scope", "FooterService", FeeCalculatorController]);

function TXController($scope, $timeout, $interval, $location, TXService){
	let type = "";
	let absUrl = $location.absUrl();
	let reg = /type=([a-z]+)/;
	if(absUrl && absUrl.match(reg) && absUrl.match(reg).length==2){
		type = absUrl.match(reg)[1];
	}
	$scope.page = 1;
	$scope.txList = [];
	$scope.txHashes = ",";
	$scope.fadeFlag = false;
	$scope.loadTXList = function(){
		TXService.txList({"page": $scope.page, "type": type}, function(r_txList){
			$scope.txHashes = ",";
			$scope.txList = r_txList;
			for(let i in $scope.txList){
				$scope.txHashes += $scope.txList[i].hash + ",";
				$scope.txList[i] = $scope.handleTX($scope.txList[i]);
			}
			$scope.updateAge();
			$timeout(function(){
				$scope.fadeFlag = true;
			});	
		});
	}
	$scope.addTX = function(){
		TXService.txList({"page": $scope.page, "type": type}, function(r_txList){
			for(let i=r_txList.length-1;i>=0;i--){
				let tx = r_txList[i];
				let searchHash = ","+tx.hash+",";
				if($scope.txHashes.indexOf(searchHash)!=-1)
					continue;
				tx = $scope.handleTX(r_txList[i]);
				let removeTX = $scope.txList[9];
				let removeHash = "," + removeTX.hash + ",";
				let addHash = "," + tx.hash + ",";
				$scope.txHashes = $scope.txHashes.replace(removeHash, addHash);
				$scope.txList.splice(9, 1);
				$scope.txList.unshift(tx);
			}
			$scope.updateAge();
			$timeout(function(){
				$scope.fadeFlag = true;
			});	
		});
	}
	// tx age
	$interval(function() {
		$scope.updateAge();
	}, 1000);
	$scope.updateAge = function(){
		let nowTime = new Date().getTime();
		for(let index in $scope.txList){
			let tx = $scope.txList[index];
			tx.age = compareTime(nowTime, tx.time);
		}
	};
	$scope.nextPage = function(){
		$scope.page++;
		$scope.fadeFlag = false;
		$scope.loadTXList();
	};
	$scope.previousPage = function(){
		if($scope.page>1){
			$scope.page--;
			$scope.fadeFlag = false;
			$scope.loadTXList();
		}
	};
	//load transaction detail
	$scope.showTx = function(index, $event){;
		$scope.selectedTXHash = $scope.txList[index].hash;
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#txDetail").modal("show");
		let hash = $scope.txList[index].hash;
		let height = $scope.txList[index].height;
		return showTransaction(height, hash, $scope, TXService);
	};
	$scope.loadTXList();

	// websocket - new block
	let sock = new SockJS('/ws/transaction');
	sock.onmessage = function(e) {
		if(!e || !e.data)
			return;
		$scope.addTX();

    };
    $scope.handleTX = function(tx) {
		if(!tx)
			return;
		tx.time = tx.timeStamp;
		tx.timeStamp = fmtDate(tx.timeStamp);
		tx.amount = fmtXEM(tx.amount);
		tx.fee = fmtXEM(tx.fee);
		tx.typeName = "";
		if(tx.type==257)
			tx.typeName += "transfer | ";
		if(tx.type==2049)
			tx.typeName += "importance | ";
		if(tx.type==4097)
			tx.typeName += "aggregate | ";
		if(tx.type==4100){
			tx.typeName += "multisig | ";
			if(tx.aggregateFlag==1)
				tx.typeName += "aggregate | ";
		}
		if(tx.type==8193)
			tx.typeName += "namespace | ";
		if(tx.type==16385 || tx.type==16386 || tx.mosaicTransferFlag==1)
			tx.typeName += "mosaic | ";
		if(tx.apostilleFlag==1)
			tx.typeName += "apostille | ";
		if(tx.typeName!="" && tx.typeName.length>=2)
			tx.typeName = tx.typeName.substring(0, tx.typeName.length-3);
		return tx;
	};    
	
}


function graphController($scope, $location, TXService) {
  let type = "";
  $scope.gxList = [];
  let absUrl = $location.absUrl();
  $scope.graphTx = function() {
    var countNum = 0;

    TXService.reportTx({ page: $scope.page, type: type }, function(r_txList) {
      $scope.gxList = r_txList;
      var startDate = new Date(new Date().setHours(0,0,0,0)); //YYYY-MM-DD
      startDate.setDate(startDate.getDate() - 10);
      var endDate = new Date(new Date().setHours(0,0,0,0)); //YYYY-MM-DD
      endDate.setDate(endDate.getDate() - 1);

      var getDateArray = function(start, end) {
        var arr = new Array();
        var dt = new Date(start);
        while (dt <= end) {
          arr.push(new Date(dt));
          dt.setDate(dt.getDate() + 1);
        }
        return arr;
      };

      var dateArr = getDateArray(startDate, endDate);

      var ctx = document.getElementById("myChart");
      var myChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [
            dateArr[0].toLocaleDateString(),
            dateArr[1].toLocaleDateString(),
            dateArr[2].toLocaleDateString(),
            dateArr[3].toLocaleDateString(),
            dateArr[4].toLocaleDateString(),
            dateArr[5].toLocaleDateString(),
            dateArr[6].toLocaleDateString(),
            dateArr[7].toLocaleDateString(),
            dateArr[8].toLocaleDateString(),
            dateArr[9].toLocaleDateString()
          ],
          datasets: [
            {
              label: "Total transaction ",
              data: [
                $scope.gxList[9],
                $scope.gxList[8],
                $scope.gxList[7],
                $scope.gxList[6],
                $scope.gxList[5],
                $scope.gxList[4],
                $scope.gxList[3],
                $scope.gxList[2],
                $scope.gxList[1],
                $scope.gxList[0]
              ],
              borderColor: "#3e95cd",
              fill: false
            }
          ]
        },
        options: {
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true
                }
              }
            ]
          }
        }
      });
    });
  };
}

function FeeCalculatorController($scope, FooterService){
	$("#mosaic").hide();
	$scope.mosaicBox = false;
	$scope.amount = "0";
	$scope.mosaicAmount = "0";
	$scope.mosaicSupply = "0";
	$scope.mosaicDiv = "0";
	$scope.fee = "0.050000" * $scope.multiplier;
	$scope.message = "";
	$scope.multiplier = '1';
	$scope.dur = '1';
	$scope.selectedDuration = 1;

	const baseTransactionFee = 3;
	const currentFeeFactor = 0.05;

	$scope.messageType = [{
		'name': 'Hexadecimal',
		'value': '2048'
	}, {
		'name': 'Unencrypted',
		'value': '1024'
	}, {
		'name': 'Encrypted',
		'value': '976'
	}];

	$scope.durationType = [{
		'name': 'Day',
		'value': '1'
	}, {
		'name': 'Month',
		'value': '30'
	}, {
		'name': 'Year',
		'value': '365'
	}];

	FooterService.market(function(r_market){
		if(!r_market || !r_market.btc || !r_market.usd || !r_market.cap)
			return;
		$scope.price = r_market.usd;
		$scope.feeUSD = '$'+($scope.price * $scope.fee).toFixed(2);
	});

	$scope.hideAmount = function() {
		var checkBox = document.getElementById("checkbox");

		var text = document.getElementById("amount");

		if (checkBox.checked == true){
    		$("#amount").hide();
    		$("#amount2").hide();
    		$("#mosaic").show();
    		$scope.amount = "0";
    		if($scope.message.length == 0) {
    			$scope.fee = (0.000000).toFixed(6);
    			$scope.feeUSD = '$'+($scope.price * $scope.fee).toFixed(2);
    		}else {
    			$scope.fee = (($scope.feeMessage * ($scope.dur * $scope.selectedDuration)) * $scope.multiplier).toFixed(6);
    			$scope.feeUSD = '$'+($scope.price * $scope.fee).toFixed(2);
    		}
  		} else {
    		$("#amount").show();
    		$("#amount2").show();
    		$("#mosaic").hide();
    		$scope.mosaicAmount = "0";
    		if($scope.message.length == 0) {
    			$scope.fee = ((0.050000 * ($scope.dur * $scope.selectedDuration)) * $scope.multiplier).toFixed(6);
    			$scope.feeUSD = '$'+($scope.price * $scope.fee).toFixed(2);
    		}
    		else {
    			let fees = $scope.feeMessage + 0.05;
    			$scope.fee = ((fees * ($scope.dur * $scope.selectedDuration)) * $scope.multiplier).toFixed(6);
    			$scope.feeUSD = '$'+($scope.price * $scope.fee).toFixed(2);
    		}
			$scope.mosaicSupply = "0";
			$scope.mosaicDiv = "0";
  		}
	};

	$scope.getMessageType = function(){
		$scope.handle();
	};

	$scope.getDurationType = function(){
		$scope.handle();
		if ($scope.selectedDuration == 1) {
			$scope.duType = 'Days';
			return;
		}
		else if ($scope.selectedDuration == 30) {
			$scope.duType = 'Months';
			return;
		}
		else if ($scope.selectedDuration == 365) {
			$scope.duType = 'Years';
			return;
		}
	};

	$scope.handle = function(){
		let mosaicAmountTxt = $scope.mosaicAmount.replace(/\s+/, "").replace(/,/g, "");
		let mosaicSupplyTxt = $scope.mosaicSupply.replace(/\s+/, "").replace(/,/g, "");
		let mosaicDivTxt = $scope.mosaicDiv.replace(/\s+/, "").replace(/,/g, "");
		let amountTxt = $scope.amount.replace(/\s+/, "").replace(/,/g, "");
		let messageTxt = $scope.message;
		let multiplierTxt = $scope.multiplier.replace(/\s+/, "").replace(/,/g, "");
		let durTxt = $scope.dur.replace(/\s+/, "").replace(/,/g, "");
		let amount = new Number(amountTxt);
		let mosaicAmount = new Number(mosaicAmountTxt);
		let mosaicSupply = new Number(mosaicSupplyTxt);
		let mosaicDiv = new Number(mosaicDivTxt);
		let multiplier = new Number(multiplierTxt);
		let dur = new Number(durTxt);
		let message = new String(messageTxt);
		var checkBox = document.getElementById("checkbox");

		var textarea = document.getElementById('textarea');

		 if($scope.selectedValue == 2048) {
		    var reg1 = /[^0-9a-fA-F]/; 
		    if (reg1.test(textarea.value) == true) {
		    	textarea.style.border ='1px solid red';
		    	textarea.style.color ='red';
		    }
		    else {
		    	textarea.style.border = '0';
		    	textarea.style.borderBottom = '2px solid #1779ba';
		    	textarea.style.color = '#1779ba';
		    }
		}else {
			textarea.style.border = '0';
		    textarea.style.borderBottom = '2px solid #1779ba';
		    textarea.style.color = '#1779ba';
		}

		if (checkBox.checked == true){
			let feeMessage = $scope.calculateMessage(message);
			$scope.feeMessage = feeMessage;
			let feeMosaic = $scope.calculateMosaics(mosaicAmount, mosaicSupply, mosaicDiv);
			$scope.total = feeMessage + feeMosaic;
			$scope.fee = (($scope.total * (dur * $scope.selectedDuration)) * $scope.multiplier).toFixed(6);
			$scope.feeUSD = '$'+($scope.price * $scope.fee).toFixed(2);
			return;
		}
		else {
			let feeMessage = $scope.calculateMessage(message);
			$scope.feeMessage = feeMessage;
			let feeAmount = $scope.calculateMinimum(amount);
			$scope.total = feeMessage + feeAmount;
			$scope.fee = (($scope.total * (dur * $scope.selectedDuration)) * $scope.multiplier).toFixed(6);
			$scope.feeUSD = '$'+($scope.price * $scope.fee).toFixed(2);
			return;
		}
	};
	
$scope.calculateMessage = function(message) {
	let length;

    if (!message.length)
        return 0.00;
    if ($scope.selectedValue == 2048) {
    	length = (message.length + 2)/2;
    }
    else if ($scope.selectedValue == 1024) {
    	length = message.length;
    }
    else if ($scope.selectedValue == 976) {
    	length = 32 + 16 + Math.ceil(message.length / 16) * 16;
    }
    
    $scope.message = message;
    return currentFeeFactor * (Math.floor(length / 32) + 1);
};

$scope.calculateMosaics = function(quantity, supply, divisibility) {
    let totalFee = 0;
    let fee = 0;
    let supplyRelatedAdjustment = 0;

    	if(supply == 0 || divisibility == 0){
    		return 0.00;
    	}

        if (supply <= 10000 && divisibility === 0) {
            // Small business mosaic fee
            fee = currentFeeFactor;
        } else {
            let maxMosaicQuantity = 9000000000000000;
            let totalMosaicQuantity = supply * Math.pow(10, divisibility)
            supplyRelatedAdjustment = Math.floor(0.8 * Math.log(Math.floor(maxMosaicQuantity / totalMosaicQuantity)));
            //let numNem = calculateXemEquivalent(quantity, supply, divisibility);
            // Using Math.ceil below because xem equivalent returned is sometimes a bit lower than it should
            // Ex: 150'000 of nem:xem gives 149999.99999999997
            //fee = calculateMinimum(Math.ceil(numNem));
            fee = $scope.calculateXemEquivalent(quantity, supply, divisibility);
        }
        totalFee = currentFeeFactor * Math.max(1, fee - supplyRelatedAdjustment);

    return totalFee;
};

$scope.calculateMinimum = function(numNem) {
    let fee = currentFeeFactor * Math.floor(Math.max(1, numNem / 10000));
    return fee > 1.25 ? 1.25 : fee;
};

$scope.calculateXemEquivalent = function(quantity, supply, divisibility) {
    if (supply === 0) {
        return 0;
    }

    return Math.min(25, quantity*900000/supply);
};
	$scope.handle();

}


function SearchTXController($scope, $location, TXService){
	var absUrl = $location.absUrl();
	if(absUrl==null){
		return;
	}
	var reg = /hash=(\w{64})/;
	if(absUrl.match(reg).length==2){
		var hash = absUrl.match(reg)[1];
		showTransaction(null, hash, $scope, TXService);
	}
}

function UnconfirmedTXController($scope, $timeout, $interval, $location, TXService){
	$scope.txList = [];
	$scope.fadeFlag = false;
	$scope.loadUnconfirmedTXList = function(){
		TXService.unconfirmedTXList(function(r_txList){
			$scope.txList = r_txList;
			for(let i in $scope.txList)
				$scope.txList[i] = $scope.handleTX($scope.txList[i]);
			$scope.updateAge();
			$timeout(function(){
				$scope.fadeFlag = true;
			});
		});
	}
	// tx age
	$interval(function() {
		$scope.updateAge();
	}, 1000);
	$scope.updateAge = function(){
		let nowTime = new Date().getTime();
		for(let index in $scope.txList){
			let tx = $scope.txList[index];
			tx.age = compareTime(nowTime, tx.time);
		}
	};
	//load unconfirmed transaction detail
	$scope.showUnconfirmedTx = function(index, $event){
		$scope.selectedTXSign = $scope.txList[index].signature;
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#txDetail").modal("show");
		return showUnconfirmedTransaction($scope.txList[index], $scope);
	};
	$scope.loadUnconfirmedTXList();
	// websocket - unconfirmed transactions
	let sock = new SockJS('/ws/unconfirmed');
	sock.onmessage = function(e) {
		if(!e || !e.data)
			return;
		let data = JSON.parse(e.data);
		if(!data || !data.action)
			return;
		if(data.action == "add"){ //add new unconfirmed transaction
			let tx = $scope.handleTX(data.content);
			$scope.txList.unshift(tx);
		} else if(data.action == "remove"){
			let signature = data.content.signature;
			let newTxList = [];
			for(let i in $scope.txList){
				let item = $scope.txList[i];
				if(item && item.signature && item.signature!=signature)
					newTxList.push(item);
			}
			$scope.txList = newTxList;
		} else if(data.action == "update"){
			let tx = data.content;
			for(let i in $scope.txList){
				let item = $scope.txList[i];
				if(item && item.signature && item.signature==tx.signature){
					let tx = $scope.handleTX(data.content);
					$scope.txList[i] = tx;
				}
			}
		} else if(data.action == "expired"){
			let newTxList = [];
			let nowTime = new Data().getTime();
			for(let i in $scope.txList){
				let item = $scope.txList[i];
				if(!item)
					continue;
				let deadline = item.deadline * 1000 + Date.UTC(2015, 2, 29, 0, 6, 25, 0);
				if(nowTime <= deadline)
					newTxList.push(item);
			}
			$scope.txList = newTxList;
		}
		$scope.$apply();
    };
    $scope.handleTX = function(tx) {
		if(!tx)
			return;
		tx.time = tx.timeStamp;
		tx.timeStamp = fmtDate(tx.timeStamp);
		tx.deadline = fmtDate(tx.deadline);
		tx.amount = isNaN(tx.amount)?0:fmtXEM(tx.amount);
		tx.fee = fmtXEM(tx.fee);
		tx.typeName = "";
		if(tx.type==257)
			tx.typeName += "transfer | ";
		if(tx.type==2049)
			tx.typeName += "importance | ";
		if(tx.type==4097)
			tx.typeName += "aggregate | ";
		if(tx.type==8193)
			tx.typeName += "namespace | ";
		if(tx.type==16385 || tx.type==16386 || tx.mosaicTransferFlag==1)
			tx.typeName += "mosaic | ";
		if(tx.apostilleFlag==1)
			tx.typeName += "apostille | ";
		if(tx.aggregateFlag==1)
			tx.typeName += "aggregate | ";
		if(tx.type==4100){
			tx.typeName += "multisig | ";
			if(tx.otherTrans.type==4097)
				tx.typeName += "aggregate | ";
			tx.amount = tx.otherTrans.amount?fmtXEM(tx.otherTrans.amount):0;
			tx.fee = tx.otherTrans.fee?fmtXEM(tx.otherTrans.fee):0;
			tx.sender = tx.otherTrans.sender;
			tx.recipient = tx.otherTrans.recipient;
			tx.typeName = tx.typeName.replace("multisig", "multisig (" + tx.signed.length + "/" + tx.minSigned + ")");
		}
		if(tx.typeName!="" && tx.typeName.length>=2)
			tx.typeName = tx.typeName.substring(0, tx.typeName.length-3);
		return tx;
	};
}


