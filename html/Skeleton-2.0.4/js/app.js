  function makeRow (data){
    var primary = data.status.toLowerCase() !== "paid" ? " button-primary" : "";
    return $(' \
      <a class="button '+ data.status.toLowerCase() + primary + '"> \
          <table class="u-full-width"> \
            <tbody> \
              <tr class="header"> \
                <td colspan="2" class="title">' + data.title + ' <!-- i class="fa fa-info-circle"></i --></td> \
                <td class="status">'+ data.status.toUpperCase() +'</td> \
              </tr> \
              <tr class="info"> \
                <td class="amount">$'+ data.amount +'</td> \
                <td class="total">'+ data.totalOwed +'</td> \
                <td class="date">'+ data.date +'</td> \
                <td class="website hidden">'+ data.website +'</td> \
                <td class="notes hidden">'+ data.notes +'</td> \
              </tr> \
            </tbody> \
          </table> \
        </a> \
    ');
  }

  function makeMenuButton (data){
    var selected = data.count === 0
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
        $('a.button.selected').removeClass('selected')
        $(this).addClass('selected');
        $('.container .row .column:not(.menu)').addClass('hidden');
        var itemName = item === 'debts'
          ? 'liabilities'
          : item;
        $('.container .row .column.' + itemName).removeClass('hidden');
      });
      $menuContainer.append($button);
    });
  }

  function popUpModal(target, content){
   if(content){
    $('div#popup-modal').html(content);
   }
   if ($('div#popup-modal.show').length){
     $('div#popup-modal').css({top:'100%', bottom: '100%'});
     $('div#popup-modal').removeClass('show');
     $('body').removeClass('lock-screen');
   } else {
     var scrollTop = $('body').scrollTop();
     $('div#popup-modal').css({top:scrollTop, bottom: -1*scrollTop});
     $('body').addClass('lock-screen');
     $('div#popup-modal').addClass('show');
   }
  }

  function createUI(data){
    makeMenu($('div.menu'));

    window.MAIN_DATA = data;

    MAIN_DATA.liabilities = MAIN_DATA.liabilities.map(function(item){

      if (item.status.toLowerCase() === 'paid' && new Date(item.date) <= new Date()){
        item.status = "Due";
      }
      return item;
    });

    var getByName = function(title){
      return this.filter(function(val,i,arr){ return val.title.toLowerCase().indexOf(title) >= 0; })[0];
    }
    MAIN_DATA.liabilities.getByName = getByName;
    MAIN_DATA.assets.getByName = getByName;

    var pending = MAIN_DATA.liabilities.filter(function(a){
      return a.status.toLowerCase() === 'pending'
    }).sort(function(a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    var paid = MAIN_DATA.liabilities.filter(function(a){
      return a.status.toLowerCase() === 'paid'
    }).sort(function(a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    var due = MAIN_DATA.liabilities.filter(function(a){
      return a.status.toLowerCase() === 'due'
    }).sort(function(a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    var liabilities = [].concat(due, pending, paid);
    liabilities.forEach(function(item){
      if (item.hidden === "true") return;
      $('div.liabilities').append(makeRow({
          status: item.status,
          title: item.title,
          amount: item.amount,
          totalOwed: item.total_owed > 0 ? '$'+item.total_owed : '',
          date: item.date,
          website: item.website,
          notes: item.note
      }));
    });

    var makeAccountContent = function($clickedRow){
      var statusItems = ['due', 'pending', 'paid'];
      var statusRow = function(status){
        return '<div class="row status">' +
          statusItems.reduce(function(target, item){
            var className = ' class="' +
              (item === status.toLowerCase() ? 'selected ' : '') +
              item + '"';
            return target + '<button'+className+'>' + item + '</button>';
          }, '') +
        '</div>';
      }

      var originalDateString = $clickedRow.find('.date').text();
      var originalStatus = $clickedRow.find('.status').text();
      var notes = $clickedRow.find('.notes').text();

      var content = $('<div class="container content">'
        + '<h2>'
          + '<a target="_blank" href="'+$clickedRow.find('.website').text()+'">'
          + $clickedRow.find('.title').text()
          + '</a>'
        +'</h2>'
          + statusRow(originalStatus)
          + '<label>Notes</label>'
          + '<textarea class="notes">' + notes + '</textarea>'
          + '<label>Amount</label>'
          + '<input class="amount" type="number" value="'+$clickedRow.find('.amount').text().replace(/\$/g,'')+'"/>'
          + '<button class="graph"><i class="fa fa-bar-chart"></i></button>'
          + '<label>Total</label>'
          + '<div class="row"><input  class="total" type="number" value="'+$clickedRow.find('.total').text().replace(/\$/g,'')+'"/>'
          + '<button class="graph"><i class="fa fa-bar-chart"></i></button></div>'
          + '<label>Date</label>'
          + '<input type="date" value="'+ originalDateString +'"/>'
          + '<div class="row actions">'
            +'<button class="button-primary cancel" onClick="">Cancel</button>'
            +'<button class="button-primary save" onClick="">Save</button>'
          +'</div>'
        + '</div>');
      var getStatus = function($item){
        var status = $item.attr('class').replace(/selected/g, '').trim();
        status = status.substring( 0, 1 ).toUpperCase() + status.substring(1).trim();
        return status;
      };

      content.find('.status.row button').on('click', function (e){
        var currentSelectedStatus = getStatus(content.find('.selected'));
        var clickedStatus = getStatus($(this));

        if(clickedStatus.toLowerCase() === 'paid' && originalStatus.toLowerCase() !== 'paid'){
          var day = Number(originalDateString.replace(/.*-/g,''));
          var month = Number(originalDateString.replace(/-..$/g,'').replace(/.*-/g,''));
          var year = Number(originalDateString.replace(/-.*/g,''));
          if (month === 12) {
            year += 1;
            month = 1;
          } else {
            month += 1;
          }
          day = (day < 10) ? '0'+day : day;
          month = (month < 10) ? '0'+month : month;
          content.find('input[type="date"]').val(year + '-' + month + '-' + day)
        } else {
          content.find('input[type="date"]').val(originalDateString);
        }
        content.find('.status.row button').removeClass('selected');
        $(this).addClass('selected');
      });

      var getCurrentItem = function(item){
        var status = getStatus(item.find('.selected'));
        return {
          name: item.find('h2').text().trim(),
          status: status,
          amount: item.find('.amount').val(),
          total: item.find('.total').val(),
          date: item.find('input[type="date"]').val(),
          notes: item.find('textarea.notes').val()
        };
      }
      content.find('button.cancel').on('click', function (e){
        $('#popup-modal').click();
      });
      content.find('button.save').on('click', function (e){

        var currentItem = getCurrentItem($(this).parent().parent());
        var previousVersion = MAIN_DATA.liabilities.getByName(currentItem.name.toLowerCase());
        previousVersion.title = currentItem.name;
        previousVersion.status = currentItem.status;
        previousVersion.amount = currentItem.amount;
        previousVersion.total_owed = currentItem.total || '0.00';
        previousVersion.date = currentItem.date;
        previousVersion.note = currentItem.notes.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        $.post( "/", JSON.stringify(MAIN_DATA),function( data ) {
          console.log( "SERVER RESPONSE", data );
          location.reload();
        });
      });
      return content;
    }

    $('a.button').on("click", function(e){
      switch (true){
        case $(this).is('.menu'):
          break;
        case $(this).is('.paid, .pending, .due'):
          $('a.button.selected:not(".menu")').removeClass('selected')
          var content = typeof makeAccountContent === "function" && makeAccountContent($(this));
          typeof popUpModal === "function" && popUpModal($(this), content);
          break;
        default:
          console.log('--- some other case');
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
  }

  $.get("/json", createUI);

  function handleTouchMove(e){
    if($('div#popup-modal.show').length){
      e.preventDefault();
      return false;
    }
  }

  $(document).ready(function(){
    var colorsList = [];
    var bgColor = "rgba(81, 84, 17, 0.46)";
    backgroundGradient(colorsList, 3, 3, bgColor);
    var lockOrientation = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation || function(){};
    lockOrientation("portrait-primary");
    $(window).on("touchmove", handleTouchMove);
  });