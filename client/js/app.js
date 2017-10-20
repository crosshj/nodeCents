  /*
    TODO:
      - DO NOT open popup if x scrolling
      - DO NOT x scroll if popup is opening
      - DO NOT x scroll if y is scrolling
      - DO NOT y scroll if x is scrolling
      - dirty form controls
      - account history
      - integrate with DB service
      - new account / restore / demo account
  */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js', {scope: './'}).then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope); //eslint-disable-line no-console
      navigator.serviceWorker.addEventListener('message', event => {
        console.log(event.data.msg, event.data.url);
      });
    }).catch(function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err); //eslint-disable-line no-console
    });
  });
}

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

  function makeRow (data){
    var primary = data.status.toLowerCase() !== "paid" ? " button-primary" : "";
    const row = $(`
      <a class="button ${data.status.toLowerCase() + primary}">
          <table class="u-full-width">
            <tbody>
              <tr class="header">
                <td colspan="2" class="title">
                  ${data.title}
                  <!-- i class="fa fa-info-circle"></i -->
                </td>
                <td class="status">
                  ${data.status.toUpperCase()}
                </td>
              </tr>
              <tr class="info">
                <td class="amount">${formatMoney(data.amount)}</td>
                <td class="total">${Boolean(data.totalOwed) ? formatMoney(data.totalOwed) : ''}</td>
                <td class="date">${data.date}</td>
                <td class="website hidden">${data.website}</td>
                <td class="notes hidden">${data.note}</td>
                <td class="auto hidden">${data.auto||'false'}</td>
              </tr>
            </tbody>
          </table>
        </a>
    `);
    return row;
  }

  function makeAddNew(){
    return $(`
      <a id="add-new" class="button">Add New</a>
    `);
  }

  function makeTotalsRow({balance=0, pending=0, due=0, assets=0, debts=0, debtTotal=0}){
    var totalsRow = $(`
      <a class="button totals">
        <table class="u-full-width">
          <tbody>
            <tr class="header">
              <td colspan="2" class="title center">Current</td>
            </tr>
            <tr class="header">
              <td class="title">Balance</td>
              <td class="status">${formatMoney(balance)}</td>
            </tr>
            <tr class="header">
              <td class="title">Pending</td>
              <td class="status">${formatMoney(pending)}</td>
            </tr>
            <tr class="header">
              <td class="title">Due</td>
              <td class="status">${formatMoney(due)}</td>
            </tr>
            <tr class="header">
              <td class="title"></td>
              <td class="status">${formatMoney(balance - pending - due)}</td>
            </tr>
          </tbody>
        </table>
      </a>
      <a class="button totals">
        <table class="u-full-width">
          <tbody>
            <tr class="header">
              <td colspan="2" class="title center">Monthly</td>
            </tr>
            <tr class="header">
              <td class="title">Assets</td>
              <td class="status">${formatMoney(assets)}</td>
            </tr>
            <tr class="header">
              <td class="title">Debt</td>
              <td class="status">${formatMoney(debts)}</td>
            </tr>
            <tr class="header">
              <td class="title"></td>
              <td class="status">${formatMoney(assets - debts)}</td>
            </tr>
          </tbody>
        </table>
      </a>
      <a class="button totals" id="totals_history">
        <table class="u-full-width">
          <tbody>
            <tr class="header">
              <td class="title">Debt Total</td>
              <td class="status">${formatMoney(debtTotal)}</td>
            </tr>
            <tr class="header history">
              <td colspan="2" class="title center">
                <button>History</button>
              </td>
            </tr>
          </tbody>
        </table>
      </a>
    `);
    return totalsRow;
  }

  function makeMenuButton (data){
    var initialIndex = localStorage && localStorage.getItem('selectedTab');
    var selected = data.count === Number(initialIndex)
      ? " selected "
      : "";
    return $(' \
      <a class="button menu button-primary '+ data.name.toLowerCase() + selected + '"> \
          ' + data.name.toLowerCase() + ' \
      </a> \
    ');
  }

  function makeMenu ($menuContainer){
    var menu = ["debts", "totals", "assets"];
    menu.forEach(function(item, i){
      var $button = makeMenuButton({ name: item, count: i});
      $button.click(function(){
        window.flkty && window.flkty.selectCell(i);
      });
      $menuContainer.append($button);
    });
  }

  function createUI(data){
    makeMenu($('div.menu'));
    var formattedData = formatAccountData(data);

    formattedData.liabilities.forEach(function(item){
      if (item.hidden === "true") return;
      var row = JSON.parse(JSON.stringify(item));
      row.totalOwed = item.total_owed > 0 ? '$'+item.total_owed : '';
      $('div.liabilities').append(makeRow(row));
    });

    $('div.liabilities').append(makeAddNew());

    formattedData.assets.forEach(function(item){
      if (item.hidden === "true") return;
      var row = JSON.parse(JSON.stringify(item));
      row.totalOwed = item.total_owed > 0 ? '$'+item.total_owed : '';
      $('div.assets').append(makeRow(row));
    });

    $('div.totals .row').append(makeTotalsRow(formattedData.totals || {}));

    $('a.button:not(.menu)').on("click", function(e){
      switch (true){
        case $(this).is('.paid, .pending, .due'):
          $('a.button.selected:not(".menu")').removeClass('selected')
          var content = typeof makeAccountContent === "function" && makeAccountContent($(this));
          typeof popUpModal === "function" && popUpModal($(this), content);
          break;
        case $(this).is('#add-new'):
          console.log('clicked add new');
          $('a.button.selected:not(".menu")').removeClass('selected')
          var content = typeof makeAccountContent === "function" && makeAccountContent($(this));
          typeof popUpModal === "function" && popUpModal($(this), content);
          break;
        case $(this).is('#totals_history'):
          console.log('totals history');
          typeof showHistoryPopup === "function" && showHistoryPopup($(this), {
            type: 'balance',
            title: 'Total Owed',
            field: 'Amount'
          });
          break;
        default:
          console.log('--- some other case', $(this));
          break;
      }
    });

    $('#popup-modal').on('click', function(e){
      if(e.target !== e.currentTarget) return;
      typeof popUpModal === "function" && popUpModal();
      $('a.button.selected:not(".menu")').removeClass('selected')
    });

    $('#popup-modal .content').on('click', function(e){
      e.stopPropagation();
      return false;
    });

    // why is this?
    // setTimeout(function(){
    //   setupSwipe();
    // }, 1);
    setupSwipe();
  }

  function handleTouchMove(e){
    if($('div#popup-modal.show').length){
      e.preventDefault();
      return false;
    }
  }

  function setupSwipe(){
    if (!window.Flickity){
      console.log('No swipe library found');
      return;
    }
    var initialIndex = localStorage && localStorage.getItem('selectedTab');
    initialIndex = initialIndex || 0;

    // setup column swipe
    window.flkty = new Flickity('#main-carousel', {
      // options
      initialIndex,
      setGallerySize: false,
      dragThreshold: 50,
      prevNextButtons: false,
      pageDots: false,
      wrapAround: true,
      draggable: true,
      percentPosition: true
    });
    function selectListener(/* parameters */) {
      var selectedTab = document.querySelector('.menu .button.selected');
      if (selectedTab){
        selectedTab.className = selectedTab.className.replace(/selected/,'').trim();
      }
      var tabToSelect = document.querySelectorAll('.menu .button')[flkty.selectedIndex];
      if (tabToSelect){
        tabToSelect.className += ' selected';
        localStorage.setItem('selectedTab', flkty.selectedIndex);
      }
    }
    flkty.on( 'select', selectListener );

    // function scrollListener(progress) {
    //   var someProg = Math.max( 0, Math.min( 1, progress ))
    //   document.querySelector('.bar-container .bar').style.left = 100 * someProg * 0.6666 + "%";
    // }
    //flkty.on( 'scroll', scrollListener );

    // TODO: don't change tabs while scrolling
    // function tempDisableDrag() {
    //   flkty.unbindDrag();
    //   setTimeout(function(){
    //     flkty.bindDrag();
    //   }, 1000);
    // }
    // $(document).scroll(tempDisableDrag);
    // $(window).on("touchmove", tempDisableDrag);
  }

  function serializeLogin(username, password){
    return `username=${username}&password=${password}`;
  }

  function ajaxLogin(username, password, callback){
    const loginBody = serializeLogin(username, password);

    fetch('./login/', {
      method: 'POST',
      body: loginBody,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'same-origin'
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      console.log('login success -->', data);
      if (callback) callback(null, data);
    }).catch(function(error) {
      console.log('login error --> ', error);
      if (callback) callback(error);
    });
  }

  function login(){
    document.querySelector('#login').className = '';
    //window.location.replace("login/");
  }
  var GLOBAL_FUNCTION_QUEUE = [];
  function getMainData(){
    $.getJSON("./json", mainData => {
      if (!mainData || mainData.error){
        GLOBAL_FUNCTION_QUEUE.push(this);
        login();
        return;
      }
      $.getJSON("./accounts", scrapedData => {
        var data = mainData;
        
        data.scraped = scrapedData;
        createUI(data);
      });
    });
  }
  //make it so this inside function is the function itself
  getMainData.bind(getMainData)();

  $(document).ready(function(){
    var colorsList = [];
    var bgColor = "rgba(81, 84, 17, 0.46)";
    //backgroundGradient(colorsList, 3, 3, bgColor);
    var lockOrientation = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation || function(){};
    lockOrientation("portrait-primary");
    $(window).on("touchmove", handleTouchMove);

    $(window).on("focus", () => {
      console.log('TODO: when focused, refresh if needed');
      //$('#corner-circle').text(Number($('#corner-circle').text()) + 1); 
    });
    $(window).on("blur", () => {
      console.log('TODO: on blur save current time');
      //$('#corner-circle').text(Number($('#corner-circle').text()) + 1); 
    });

    // Create IE + others compatible event handler
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

    // Listen to message from child window
    eventer(messageEvent,function(e) {
      console.log('parent received message!:  ',e.data);

      if(e.data.name === "ajaxLoginRequest"){
        const username = e.data.payload.username;
        const password = e.data.payload.password;

        const callback = () => {
          document.querySelector('#login').className = 'hidden';
          const logInIframe = document.querySelector('iframe');
          logInIframe.location = './login';
          const functionFromQueue = GLOBAL_FUNCTION_QUEUE.pop();
          functionFromQueue();
        }

        ajaxLogin(username, password, callback);
      }
    }, false);
  });
