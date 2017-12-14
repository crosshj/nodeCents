import {
    receiveAccounts, receiveLogin, receiveHistory
} from './actions';


var GLOBAL_FUNCTION_QUEUE = [];

function fetchAccounts() {
    const url = './json';
    const config = {
        credentials: 'include',
        method: 'GET',
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
    };
    fetch(url, config)
        .then(r => r.json())
        .then(body => {
            // console.log(`Response from ${url} : ${JSON.stringify(body)}`);
            if (body.error) {
                GLOBAL_FUNCTION_QUEUE.push(() => fetchAccounts());
            }
            const payload = body || {};
            payload.error = body.error || false;
            receiveAccounts(payload);
        })
        // .catch(error => {
        //     receiveAccounts({ error });
        // });
}

// TODO: steal this from misc.js later
function login({ username, password }) {
    const url = './login/';
    const config = {
        method: 'POST',
        body: `username=${username}&password=${password}`,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: 'same-origin'
    };
    fetch(url, config)
        .then(r => r.json())
        .then(function (data) {
            //console.log('login success -->', data);
            receiveLogin(undefined, data);
        }).catch(function (error) {
            console.log('login error --> ', error);
            receiveLogin(error);
        });
}

function fetchAccountsData() {
    const url = './accounts';
    const config = {
        method: 'GET',
        credentials: 'include'
    };
    fetch(url, config)
        .then(r => r.json())
        .then(function (data) {
            //console.log('get accounts data success -->', data);
        }).catch(function (error) {
            //console.log('get acccounts data error --> ', error);
        });
}

function fetchHistory({ type, title, field }) {
    function updateDiffs() {
        // if login error, this call will be retried
        const thisFunction = this;
        GLOBAL_FUNCTION_QUEUE.push(thisFunction.bind(thisFunction));
        
        const fetchField = field.toLowerCase().replace(' ', '_');
        const url = `diffs?type=${type}&account=${title}&field=${fetchField}`;
        const config = {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        };

        fetch(url, config)
            .then(r => r.json())
            .then(function (json) {
                if (json.mustLogin || json.error === 'not logged in') {
                    return login();
                }
                popFunctionQueue();
                receiveHistory(json);
            })
            .catch(function (error) {
                receiveHistory({error});
            });
    }
    updateDiffs.bind(updateDiffs)();
}

function popFunctionQueue() {
    return GLOBAL_FUNCTION_QUEUE.pop();
}

export {
    fetchAccounts, login, fetchAccountsData, fetchHistory, popFunctionQueue
}