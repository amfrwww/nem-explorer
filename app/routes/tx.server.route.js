import TXController from '../controllers/tx.server.controller';
// import graphController from '../controllers/tx.server.controller';

module.exports = function(app){
	app.route('/tx/tx').post(TXController.tx);
	app.route('/tx/list').post(TXController.txList);
	app.route('/tx/unconfirmedTXList').post(TXController.unconfirmedTXList);
	app.route('/tx/reportTx').post(TXController.reportTx);
};