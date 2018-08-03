import React from 'react';
import {formatMoney} from '../utilities';
import {
    accountClick, selectAccountClick, groupClick, newAccountClick, newGroupClick
} from '../../redux/actions';

function SeperatorRow({ data, key }){
  return (
    <div className="row-seperator">
      <p>{data.date}</p>
      <p>{data.total}</p>
    </div>
  );
}

function makeRow(data, key){
    if((data.type||'').includes('seperator')){
      return (
        <SeperatorRow {...{ data, key}} />
      );
    }
    const isGroup = data.type === 'group';
    const rowClassName = `button ${data.status.toLowerCase()} primary ${data.type} ${data.selected ? " selected" : ""}`;
    const rowClick = isGroup
        ? () => groupClick(data.title)
        : () => accountClick(data.title);
    const contextClick = isGroup
        ? e => {e.preventDefault(); accountClick(data.title); return false; }
        : e => {e.preventDefault(); selectAccountClick(data.title); return false; };

    return (
        <a className={rowClassName} key={key + '-' + data.title}
            onClick={rowClick} onContextMenu={contextClick}
        >
            <table className="u-full-width">
            <tbody>
                <tr className="header">
                    <td colSpan="2" className="title">{data.title}</td>
                    <td className="status">{data.status.toUpperCase()}</td>
                </tr>
                <tr className="info">
                    <td className="amount">{formatMoney(data.amount)}</td>
                    <td className="total">
                        {Boolean(Number(data.total_owed)) ? formatMoney(data.total_owed) : ''}
                    </td>
                    <td className="date">{data.date}</td>
                </tr>
            </tbody>
            </table>
        </a>
    );
}

function Liabilities({liabilities = []}){
    let liabRows = liabilities
        .filter(x => x)
        .map(makeRow);

    const selectedLiabs = liabilities
        .filter(x => x)
        .reduce((total, item) => item.selected
            ? total+1
            : total, 0
        );

    if(selectedLiabs === 0){
        liabRows = liabRows.concat(
            <a id="add-new" className="button" key="liab-add-new" onClick={newAccountClick}>Add New</a>
        );
    }

    if(selectedLiabs > 0){
        liabRows = liabRows.concat(
            <a id="add-group" className="button" key="liab-agg-group" onClick={newGroupClick}>Group Accounts</a>
        );
    }

    return (
    <div className="carousel-cell">
        <div className="container">
            <div className="column liabilities">
            {liabRows}
            </div>
        </div>
    </div>
    );
}

Liabilities.propTypes = {};

export default Liabilities;
