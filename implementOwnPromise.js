const STATE = {
  PENDING: "PENDING",
  FULFILLED: "FILFILLED",
  REJECTED: "REJECTED",
};

class MyPromise {
  constructor(callback) {
    this.state = STATE.PENDING;

    this.value = undefined;

    this.handlers = [];

    try {
      callback(this._resolve.bind(this), this._reject.bind(this));
    } catch (err) {
      this._reject(err);
    }
  }

  _resolve(value) {
    this.updateResult(value, STATE.FULFILLED);
  }

  _reject(value) {
    this.updateResult(value, STATE.REJECTED);
  }

  updateResult(value, state) {
    setTimeout(() => {
      if (this.state !== STATE.PENDING) {
        return;
      }

      if (isThenable(value)) {
        value.then(this._resolve, this._reject);
      }

      this.value = value;

      this.state = state;

      this.executeHandlers();
    }, 0);
  }

  addHandler(handler) {
    this.handlers.push(handler);
    this.executeHandlers();
  }

  executeHandlers() {
    if (this.state === STATE.PENDING) {
      return;
    }

    this.handlers.forEach((handler) => {
      if (this.state === STATE.FULFILLED) {
        handler.onSuccess(this.value);
      }
      if (this.state === STATE.REJECTED) {
        handler.onFail(this.value);
      }
    });

    this.handlers = [];
  }

  then(onSuccess, onFail) {
    return new MyPromise((res, rej) => {
      this.addHandler({
        onSuccess: (value) => {
          if (!onSuccess) {
            return res(value);
          }
          try {
            res(onSuccess(value));
          } catch (err) {
            rej(err);
          }
        },
        onFail: (value) => {
          if (!onFail) {
            rej(value);
          }
          try {
            res(onFail(value));
          } catch (err) {
            rej(value);
          }
        },
      });
    });
  }

  catch(onFail) {
    return this.then(null, onFail);
  }

  finally(callback) {
    let val = undefined;
    let wasRejected;

    return new MyPromise((res, rej) => {
      this.then(
        (value) => {
          val = value;
          wasRejected = false;
          return callback();
        },
        (value) => {
          value = value;
          wasRejected = true;
          return callback();
        },
      ).then(() => {
        if (!wasRejected) {
          res(val);
        }
        rej(val);
      });
    });
  }
}

function isThenable(fn) {
  if (
    typeof fn === "object" &&
    fn !== null &&
    fn.then &&
    typeof fn.then === "function"
  ) {
    return true;
  }

  return false;
}
