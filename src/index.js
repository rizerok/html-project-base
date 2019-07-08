import 'styles/style.scss';
import success from 'img/success.jpg';
import webpack from 'img/webpack.svg';

function component(msg) {
  const element = document.createElement('div');

  element.innerHTML = msg;

  return element;
}

function imgComponent(msg, imgPath) {
  const element = document.createElement('div');

  element.innerHTML = `<p>${msg}</p> <img src="${imgPath}" alt="${msg}">`;

  return element;
}

document.querySelector('#component1').appendChild(component('YOO233'));
document.querySelector('#component2').appendChild(imgComponent('JPG image from JS', success));
document.querySelector('#component3').appendChild(imgComponent('SVG image from JS', webpack));
