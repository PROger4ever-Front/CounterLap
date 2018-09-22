const states = Object.freeze({
  on: 'on',
  off: 'off'
});
const positions = Object.freeze({
  top: 'top',
  middle: 'middle',
  bottom: 'bottom',

  leftTop: 'left-top',
  rightTop: 'right-top',

  leftBottom: 'left-bottom',
  rightBottom: 'right-bottom',
});
const digitStates = Object.freeze({
  0: {
    [positions.top]: states.on,
    [positions.middle]: states.off,
    [positions.bottom]: states.on,

    [positions.leftTop]: states.on,
    [positions.rightTop]: states.on,

    [positions.leftBottom]: states.on,
    [positions.rightBottom]: states.on,
  },
  1: {
    [positions.top]: states.off,
    [positions.middle]: states.off,
    [positions.bottom]: states.off,

    [positions.leftTop]: states.off,
    [positions.rightTop]: states.on,

    [positions.leftBottom]: states.off,
    [positions.rightBottom]: states.on,
  },
  2: {
    [positions.top]: states.on,
    [positions.middle]: states.on,
    [positions.bottom]: states.on,

    [positions.leftTop]: states.off,
    [positions.rightTop]: states.on,

    [positions.leftBottom]: states.on,
    [positions.rightBottom]: states.off,
  },
  3: {
    [positions.top]: states.on,
    [positions.middle]: states.on,
    [positions.bottom]: states.on,

    [positions.leftTop]: states.off,
    [positions.rightTop]: states.on,

    [positions.leftBottom]: states.off,
    [positions.rightBottom]: states.on,
  },
  4: {
    [positions.top]: states.off,
    [positions.middle]: states.on,
    [positions.bottom]: states.off,

    [positions.leftTop]: states.on,
    [positions.rightTop]: states.on,

    [positions.leftBottom]: states.off,
    [positions.rightBottom]: states.on,
  },
  5: {
    [positions.top]: states.on,
    [positions.middle]: states.on,
    [positions.bottom]: states.on,

    [positions.leftTop]: states.on,
    [positions.rightTop]: states.off,

    [positions.leftBottom]: states.off,
    [positions.rightBottom]: states.on,
  },
  6: {
    [positions.top]: states.on,
    [positions.middle]: states.on,
    [positions.bottom]: states.on,

    [positions.leftTop]: states.on,
    [positions.rightTop]: states.off,

    [positions.leftBottom]: states.on,
    [positions.rightBottom]: states.on,
  },
  7: {
    [positions.top]: states.on,
    [positions.middle]: states.off,
    [positions.bottom]: states.off,

    [positions.leftTop]: states.off,
    [positions.rightTop]: states.on,

    [positions.leftBottom]: states.off,
    [positions.rightBottom]: states.on,
  },
  8: {
    [positions.top]: states.on,
    [positions.middle]: states.on,
    [positions.bottom]: states.on,

    [positions.leftTop]: states.on,
    [positions.rightTop]: states.on,

    [positions.leftBottom]: states.on,
    [positions.rightBottom]: states.on,
  },
  9: {
    [positions.top]: states.on,
    [positions.middle]: states.on,
    [positions.bottom]: states.on,

    [positions.leftTop]: states.on,
    [positions.rightTop]: states.on,

    [positions.leftBottom]: states.off,
    [positions.rightBottom]: states.on,
  },
});

//Implements logic of one element/lamp in traffic light's digit
class DigitElement {
  constructor(controller) {
    this.state = states.off;
    this.broken = false;
    this.controller = controller;
  }

  setState(newState) {
    let oldState = this.state;
    if (newState === oldState) {
      return;
    }
    this.state = newState;
    this.controller.onSetState(oldState, this.state);
  }

  toggleState() {
    let newState = (this.state === states.on) ? states.off : states.on;
    this.setState(newState);
  }

  setBroken(newBroken) {
    let oldBroken = this.broken;
    if (newBroken === oldBroken) {
      return;
    }
    this.broken = newBroken;
    this.controller.onSetBroken(oldBroken, this.broken);
  }

  toggleBroken() {
    let newBroken = !this.broken;
    this.setBroken(newBroken);
  }
}

//Implements logic of one digit in traffic light's counter
class CounterDigit {
  constructor(elements) {
    this.elements = elements;
  }

  setValue(digit) {
    let theStates = digitStates[digit];
    for (let position in theStates) if (theStates.hasOwnProperty(position)) {
      this.elements[position].setState(theStates[position]);
    }
  }

  parse() {
    for (let digit in digitStates) if (digitStates.hasOwnProperty(digit)) {
      let theStates = digitStates[digit];
      let isEqual = true;
      for (let position in theStates) if (theStates.hasOwnProperty(position)) {
        isEqual = isEqual && (this.elements[position].state === theStates[position]);
      }
      if (isEqual) {
        return digit;
      }
    }
    return NaN;
  }
}

//Implements logic of 2 digit counter in traffic light
class Counter {
  constructor(digit1, digit2) {
    this.digit1 = digit1;
    this.digit2 = digit2;
  }

  setValue(number) {
    this.digit1.setValue(Math.floor(number / 10));
    this.digit2.setValue(number % 10);
  }
}

//Implements binding of one digit element and its representation in DOM
class ElementDomController {
  constructor(elementEntity) {
    this.elementEntity = elementEntity;
  }

  onSetState(oldState, newState) {
    this.elementEntity.classList.remove("digit-element-" + oldState);
    this.elementEntity.classList.add("digit-element-" + newState);
  }

  onSetBroken(oldBroken, newBroken) {
    if (newBroken) {
      this.elementEntity.classList.add("digit-element-broken");
    } else {
      this.elementEntity.classList.remove("digit-element-broken");
    }
  }
}

function getElementEventListener(digitElement) {
  return function (e) {
    if (e.altKey) {
      digitElement.toggleBroken();
    } else {
      digitElement.toggleState();
    }
  }
}

function newDigitFromDom(selector) {
  let digitElements = Array.from(document.querySelectorAll(selector + " .digit-element")).reduce((acc, entity) => {
    let position = entity.dataset.position;
    let controller = new ElementDomController(entity);
    let digitElement = new DigitElement(controller);

    entity.addEventListener('click', getElementEventListener(digitElement));

    acc[position] = digitElement;
    return acc;
  }, {});
  return new CounterDigit(digitElements);
}

let countdownEnabled = false;

function countdownTick(counter, number) {
  if (!countdownEnabled || number < 0) {
    return;
  }
  counter.setValue(number);
  setTimeout(countdownTick.bind(window, counter, number - 1), 1000);
}


let digit1 = newDigitFromDom("#counter1-digit1");
let digit2 = newDigitFromDom("#counter1-digit2");
let counter = new Counter(digit1, digit2);
window.counter = counter;
console.log(counter);

const countdownButtonEntity = document.querySelector("#countdown-button");
countdownButtonEntity.addEventListener('click', function countdownClick(event) {
  countdownButtonEntity.disabled = true;
  countdownEnabled = true;
  countdownTick(counter, 60);
  countdownStopButtonEntity.disabled = false;
});
const countdownStopButtonEntity = document.querySelector("#countdown-stop-button");
countdownStopButtonEntity.addEventListener('click', function countdownStopClick(event) {
  countdownStopButtonEntity.disabled = true;
  countdownEnabled = false;
  countdownButtonEntity.disabled = false;
});

const digit1ParsingResultEntity = document.querySelector("#digit1-parsing-result");
const digit2ParsingResultEntity = document.querySelector("#digit2-parsing-result");
const parseButtonEntity = document.querySelector("#parse-button");
parseButtonEntity.addEventListener('click', function countdownClick(event) {
  let digit1Value = digit1.parse();
  let digit2Value = digit2.parse();
  digit1ParsingResultEntity.innerText = digit1Value;
  digit2ParsingResultEntity.innerText = digit2Value;
});