import Telegraf from 'telegraf';

const {BOT_TOKEN, MASTER_ID, TELEGRAM_API} = process.env;
const bypassList = [
    'message to edit not found',
    'does not contain any stream',
    'Invalid data found',
    'reply message not found',
    'message is not modified',
    'MESSAGE_ID_INVALID',
    'Invalid duration',
    'bot was kicked',
    'Could not find codec parameters for stream',
    'CHAT_WRITE_FORBIDDEN',
    'have no rights to send a message',
    'does not have storage.buckets.create access',
    'Too Many Requests',
    'need administrator rights in the channel',
    'Conversion failed',
    'wrong file id',
    'End of file',
    'does not have storage.buckets.create access to project',
    'bot is not a member',
    'Gateway',
    'message not found',
    'bot was blocked',
    'group chat was upgraded to a supergroup chat',
    'Timeout',
    '20 seconds',
    'A bucket name is needed to use Google Cloud Storage',
    'Bad auth',
    'socket hang up',
    'Long running operation has finished',
    'does not have storage.buckets.get',
    'oes not have storage.objects.delete',
    'The project to be billed is associated with a closed billing account',
];

let errorsToReport:string[] = [];

async function sendReport() {
    const tempErrorsToReport = errorsToReport;
    errorsToReport = [];

    if (tempErrorsToReport.length) {
        const reportText = tempErrorsToReport.join('\n');
        const chunks = reportText.match(/.{1,4000}/g);

        for (const chunk of chunks) {
            const telegram = new Telegraf(BOT_TOKEN, {
                username: "extra-bot",
                telegram: {
                    // @ts-ignore
                    apiRoot: TELEGRAM_API || 'https://api.telegram.org'
                }
            }).telegram;

            try {
                await telegram.sendMessage(MASTER_ID, chunk);
            } catch (err) {
                console.error(err, chunk);
            }
        }
    }
}

export default function report(err, prefix = 'default') {
    try {
        if (!err) {
            return;
        }

        if (bypassList.some((item) => err.includes(item))) {
            return;
        }

        let reportString = `(${(new Date()).toISOString()}) ${prefix.toUpperCase()}: ${err}`;
        errorsToReport.push(reportString);
        console.log(reportString);
    } catch (error) {
        // Do nothing
    }
};

setInterval(sendReport, 60 * 1000);
