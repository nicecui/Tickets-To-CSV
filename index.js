const AV = require('leanengine');
const json2csv = require('json2csv');
var fs = require('fs');

AV.init({
  appId: '',
  appKey: ''
});

function getTicketReplies(tid) {
  const query = new AV.Query('Reply');
  query.equalTo('tid', String(tid));
  query.limit(100);
  return query.find();
}

async function joinReplyToTickets(ticket, index) {
  const assigner = ticket.get('assign2');
  const tid = ticket.get('tid');
  const replies = await getTicketReplies(tid);
  
  const resultReplies = await Promise.all(
    replies.map((reply) => {
      return reply.get('content');
    })
  );

  const resultJson = {
    tid,
    content: ticket.get('content'),
    createdAt: ticket.createdAt,
    assign: ticket.get('assign2').get('username'),
    replies: resultReplies
  };

  return resultJson;
}

// Date 示例：2015-11-11 08:30:00
async function getTickets(beforeDate, afterDate) {
  try {
    const query = new AV.Query('Ticket');
    query.select(['tid', 'title', 'content', 'createdAt', 'assign2']);
    let t = new Date(beforeDate);
    query.greaterThan('createdAt', t);
    query.lessThanOrEqualTo('createdAt', new Date(afterDate));
    query.ascending('createdAt');
    query.include('assign2');
    query.limit(200);
    let tickets = [];

    do {
      query.greaterThan('createdAt', t);
      tickets = await query.find();
      const ticketsArray = await Promise.all(tickets.map(joinReplyToTickets));
      const fields = ['tid', 'content', 'createdAt', 'assign', 'replies'];
      const csv = json2csv({ data: ticketsArray, fields: fields});

      //Format For excel
      const BOM = "\uFEFF"; 
      const resultCSV = BOM + csv;

      fs.writeFileSync(`file - ${t}.csv`, resultCSV, 'utf8');
      console.log(`file.csv - ${t} saved! (～o￣3￣)～`);

      if (tickets.length !== 0) {
        t = tickets[tickets.length - 1].createdAt;
      }
    
    } while (tickets.length !== 0);
    
    console.log('All data is saved! (づ￣3￣)づ╭❤～');
  } catch (error) {
    console.log(`There is something wrong (╯‵□′)╯︵┻━┻  ${error}`);
  };  
}
// console.log(process.argv);
// console.log(process.argv);
// getTickets('2017-05-01 00:00:00', '2017-05-22 00:00:00')
getTickets(process.argv[2], process.argv[3]);
