import { test } from "node:test";
import assert from "node:assert";

import { result } from "./result.ts";

test("Result", async (t) => {
  t.test("Construction & Factory Methods", async (t) => {
    t.test("can create Ok result with result.ok()", () => {
      const value = "Hello";
      const okResult = result.ok(value);
      assert.ok(okResult.is_ok());
      assert.ok(!okResult.is_error());
    });

    t.test("can create Error result with result.error()", () => {
      const error = new Error("Test error");
      const errorResult = result.error(error);
      assert.ok(errorResult.is_error());
      assert.ok(!errorResult.is_ok());
    });

    t.test("accepts null as valid Ok value", () => {
      const nullOkResult = result.ok(null);
      assert.ok(nullOkResult.is_ok());
      if (nullOkResult.is_ok()) {
        assert.strictEqual(nullOkResult.value, null);
      }
    });

    t.test("accepts undefined as valid Ok value", () => {
      const undefinedOkResult = result.ok(undefined);
      assert.ok(undefinedOkResult.is_ok());
      if (undefinedOkResult.is_ok()) {
        assert.strictEqual(undefinedOkResult.value, undefined);
      }
    });
  });

  t.test("Type Predicates & Narrowing", async (t) => {
    t.test("is_ok() narrows type to OkResult", () => {
      const value = "Hello";
      const okResult = result.ok<string, Error>(value);
      if (okResult.is_ok()) {
        assert.strictEqual(okResult.value, value);
      } else {
        assert.fail("Result should be Ok");
      }
    });

    t.test("is_error() narrows type to ErrorResult", () => {
      const error = new Error("Test error");
      const errorResult = result.error<string, Error>(error);
      if (errorResult.is_error()) {
        assert.strictEqual(errorResult.error, error);
      } else {
        assert.fail("Result should be Error");
      }
    });
  });

  t.test("Value/Error Access", async (t) => {
    t.test("value_or() returns value for Ok results", () => {
      const value = "Hello";
      const okResult = result.ok<string, Error>(value);
      assert.strictEqual(okResult.value_or("Default"), value);

      const numericResult = result.ok<number, Error>(42);
      assert.strictEqual(numericResult.value_or(0), 42);

      const nullOkResult = result.ok(null);
      assert.ok(nullOkResult.is_ok());
      if (nullOkResult.is_ok()) {
        assert.strictEqual(nullOkResult.value, null);
      }
    });

    t.test("value_or() returns default for Error results", () => {
      const error = new Error("Test error");
      const errorResult = result.error<string, Error>(error);
      assert.strictEqual(errorResult.value_or("Default"), "Default");

      const numericResult = result.error<number, Error>(error);
      assert.strictEqual(numericResult.value_or(123), 123);
    });

    t.test("error_or() returns error for Error results", () => {
      const error = new Error("Test error");
      const errorResult = result.error<string, Error>(error);
      const defaultError = new Error("Default error");
      assert.strictEqual(errorResult.error_or(defaultError), error);
    });

    t.test("error_or() returns default for Ok results", () => {
      const value = "Hello";
      const okResult = result.ok<string, Error>(value);
      const defaultError = new Error("Default error");
      assert.strictEqual(okResult.error_or(defaultError), defaultError);
    });
  });

  t.test("Transformation Operations", async (t) => {
    t.test("map() transforms Ok values", () => {
      const value = "hello";
      const okResult = result.ok<string, Error>(value);
      const transformed = okResult.map((v) => v.toUpperCase());

      assert.ok(transformed.is_ok());
      if (transformed.is_ok()) {
        assert.strictEqual(transformed.value, "HELLO");
      }

      const numericResult = result.ok<number, Error>(42);
      const numericTransformed = numericResult.map((v) => v * 2);
      assert.ok(numericTransformed.is_ok());
      if (numericTransformed.is_ok()) {
        assert.strictEqual(numericTransformed.value, 84);
      }
    });

    t.test("map() doesn't run transformation on Error results", () => {
      const error = new Error("Test error");
      const errorResult = result.error<string, Error>(error);
      const transformed = errorResult.map(() => {
        assert.fail("Map function should not run on Error result");
        // @ts-expect-error (unreachable code)
        return "TRANSFORMED";
      });

      assert.ok(transformed.is_error());
      if (transformed.is_error()) {
        assert.strictEqual(transformed.error, error);
      }
    });

    t.test("map_err() transforms Error values", () => {
      const originalError = new Error("Original error");
      const errorResult = result.error<string, Error>(originalError);
      const transformed = errorResult.map_err(
        (err) => new Error(`Wrapped: ${err.message}`),
      );

      assert.ok(transformed.is_error());
      if (transformed.is_error()) {
        assert.strictEqual(
          transformed.error.message,
          "Wrapped: Original error",
        );
      }
    });

    t.test("map_err() doesn't run transformation on Ok results", () => {
      const value = "Hello";
      const okResult = result.ok<string, Error>(value);
      const transformed = okResult.map_err(() => {
        assert.fail("Map_err function should not run on Ok result");
        // @ts-expect-error (unreachable code)
        return new Error("Should not happen");
      });

      assert.ok(transformed.is_ok());
      if (transformed.is_ok()) {
        assert.strictEqual(transformed.value, value);
      }
    });
  });

  t.test("Pattern Matching", async (t) => {
    t.test("match() executes on_ok callback for Ok results", () => {
      const value = "Hello";
      const okResult = result.ok<string, Error>(value);
      const matched = okResult.match({
        on_ok: (v) => `Value is ${v}`,
        on_error: (e) => `Error: ${e.message}`,
      });

      assert.strictEqual(matched, "Value is Hello");
    });

    t.test("match() executes on_error callback for Error results", () => {
      const error = new Error("Test error");
      const errorResult = result.error<string, Error>(error);
      const matched = errorResult.match({
        on_ok: (v) => `Value is ${v}`,
        on_error: (e) => `Error: ${e.message}`,
      });

      assert.strictEqual(matched, "Error: Test error");
    });
  });

  t.test("Monadic Chaining", async (t) => {
    t.test("and_then() chains Ok results through function", () => {
      const value = "Hello";
      const okResult = result.ok<string, Error>(value);
      const chained = okResult.and_then((v) =>
        result.ok<number, Error>(v.length),
      );

      assert.ok(chained.is_ok());
      if (chained.is_ok()) {
        assert.strictEqual(chained.value, 5);
      }
    });

    t.test("and_then() short-circuits on Error results", () => {
      const error = new Error("Test error");
      const errorResult = result.error<string, Error>(error);
      const chained = errorResult.and_then(() => {
        assert.fail("And_then function should not run on Error result");
        // @ts-expect-error (unreachable code)
        return result.ok<number, Error>(42);
      });

      assert.ok(chained.is_error());
      if (chained.is_error()) {
        assert.strictEqual(chained.error, error);
      }
    });

    t.test("or_else() provides fallback for Error results", () => {
      const originalError = new Error("Original error");
      const errorResult = result.error<string, Error>(originalError);
      const fallback = errorResult.or_else(() =>
        result.ok<string, Error>("Fallback value"),
      );

      assert.ok(fallback.is_ok());
      if (fallback.is_ok()) {
        assert.strictEqual(fallback.value, "Fallback value");
      }
    });

    t.test("or_else() preserves Ok results unchanged", () => {
      const value = "Hello";
      const okResult = result.ok<string, Error>(value);
      const fallback = okResult.or_else(() => {
        assert.fail("Or_else function should not run on Ok result");
        // @ts-expect-error (unreachable code)
        return result.ok<string, Error>("Should not happen");
      });

      assert.ok(fallback.is_ok());
      if (fallback.is_ok()) {
        assert.strictEqual(fallback.value, value);
      }
    });
  });

  t.test("Complex Chaining", async (t) => {
    t.test("can chain multiple map operations", () => {
      const chainedResult = result
        .ok<string, Error>("hello")
        .map((v) => v.toUpperCase())
        .map((v) => v + " WORLD")
        .map((v) => v.length);

      assert.ok(chainedResult.is_ok());
      if (chainedResult.is_ok()) {
        assert.strictEqual(chainedResult.value, 11);
      }
    });

    t.test("can chain map with and_then operations", () => {
      const chainedResult = result
        .ok<string, Error>("hello")
        .map((v) => v.toUpperCase())
        .and_then((v) => result.ok<number, Error>(v.length))
        .map((v) => v * 2);

      assert.ok(chainedResult.is_ok());
      if (chainedResult.is_ok()) {
        assert.strictEqual(chainedResult.value, 10);
      }
    });

    t.test("chains short-circuit on first error", () => {
      const error = new Error("Test error");
      const chainedResult = result
        .error<string, Error>(error)
        .map(() => {
          assert.fail("Should not execute");
          // @ts-expect-error (unreachable code)
          return "transformed";
        })
        .and_then(() => {
          assert.fail("Should not execute");
          // @ts-expect-error (unreachable code)
          return result.ok<number, Error>(42);
        });

      assert.ok(chainedResult.is_error());
      if (chainedResult.is_error()) {
        assert.strictEqual(chainedResult.error, error);
      }
    });
  });

  t.test("Type System & Immutability", async (t) => {
    t.test("has correct Symbol.toStringTag", () => {
      const okResult = result.ok<string, Error>("test");
      const errorResult = result.error<string, Error>(new Error("test"));

      assert.strictEqual(okResult[Symbol.toStringTag], "Result");
      assert.strictEqual(errorResult[Symbol.toStringTag], "Result");
    });

    t.test("handles custom Error subclasses", () => {
      class CustomError extends Error {
        code: number;
        constructor(message: string, code: number) {
          super(message);
          this.name = "CustomError";
          this.code = code;
        }
      }

      const error = new CustomError("Custom error", 404);
      const errorResult = result.error<string, CustomError>(error);

      assert.ok(errorResult.is_error());
      if (errorResult.is_error()) {
        assert.strictEqual(errorResult.error.code, 404);
        assert.strictEqual(errorResult.error.message, "Custom error");
      }
    });

    t.test("asserts construction invariant", () => {
      const Constructor = result.ok(1).constructor as any;
      assert.throws(() => new Constructor({}));
      assert.throws(() => new Constructor({ ok: 1, error: new Error() }));
    });
  });

  t.test("Generator/Iterator Interface", async (t) => {
    t.test("Ok result yields its value in for-of loop", () => {
      const okResult = result.ok(42);
      const values: number[] = [];

      for (const value of okResult) {
        values.push(value);
      }

      assert.strictEqual(values.length, 1);
      assert.strictEqual(values[0], 42);
    });

    t.test("Error result yields nothing in for-of loop", () => {
      const errorResult = result.error<number, Error>(new Error("Failed"));
      const values: number[] = [];

      for (const value of errorResult) {
        values.push(value);
      }

      assert.strictEqual(values.length, 0);
    });

    t.test("can collect successful values from array of results", () => {
      const results = [
        result.ok(1),
        result.error<number, Error>(new Error("Failed")),
        result.ok(3),
        result.ok(5),
        result.error<number, Error>(new Error("Another failure")),
      ];

      const successfulValues: number[] = [];
      for (const res of results) {
        for (const value of res) {
          successfulValues.push(value);
        }
      }

      assert.deepStrictEqual(successfulValues, [1, 3, 5]);
    });

    t.test("generator works with Array.from", () => {
      const okResult = result.ok("hello");
      const values = Array.from(okResult);

      assert.strictEqual(values.length, 1);
      assert.strictEqual(values[0], "hello");

      const errorResult = result.error<string, Error>(new Error("Failed"));
      const emptyValues = Array.from(errorResult);

      assert.strictEqual(emptyValues.length, 0);
    });

    t.test("generator works with spread operator", () => {
      const okResult = result.ok(100);
      const values = [...okResult];

      assert.strictEqual(values.length, 1);
      assert.strictEqual(values[0], 100);

      const errorResult = result.error<number, Error>(new Error("Failed"));
      const emptyValues = [...errorResult];

      assert.strictEqual(emptyValues.length, 0);
    });

    t.test("can be used with destructuring", () => {
      const okResult = result.ok("test");
      const [first, second] = okResult;

      assert.strictEqual(first, "test");
      assert.strictEqual(second, undefined);

      const errorResult = result.error<string, Error>(new Error("Failed"));
      const [errorFirst, errorSecond] = errorResult;

      assert.strictEqual(errorFirst, undefined);
      assert.strictEqual(errorSecond, undefined);
    });

    t.test("generator works with different value types", () => {
      const stringResult = result.ok("hello");
      assert.deepStrictEqual([...stringResult], ["hello"]);

      const numberResult = result.ok(42);
      assert.deepStrictEqual([...numberResult], [42]);

      const objectResult = result.ok({ name: "test" });
      assert.deepStrictEqual([...objectResult], [{ name: "test" }]);

      const nullResult = result.ok(null);
      assert.deepStrictEqual([...nullResult], [null]);

      const undefinedResult = result.ok(undefined);
      assert.deepStrictEqual([...undefinedResult], [undefined]);
    });
  });

  t.test("Function Wrapping API", async (t) => {
    t.test("result.of() wraps successful function execution", () => {
      const successFn = () => "success";
      const res = result.of(successFn);

      assert.ok(res.is_ok());
      if (res.is_ok()) {
        assert.strictEqual(res.value, "success");
      }
    });

    t.test("result.of() wraps function that throws Error", () => {
      const throwingFn = () => {
        throw new Error("Test error");
      };
      const res = result.of(throwingFn);

      assert.ok(res.is_error());
      if (res.is_error()) {
        assert.strictEqual(res.error.message, "Test error");
        assert.ok(res.error instanceof Error);
      }
    });

    t.test("result.of() wraps function that throws non-Error value", () => {
      const throwingFn = () => {
        throw "string error";
      };
      const res = result.of(throwingFn);

      assert.ok(res.is_error());
      if (res.is_error()) {
        assert.strictEqual(res.error.message, "string error");
        assert.ok(res.error instanceof Error);
      }
    });

    t.test("result.of() works with different return types", () => {
      const numberResult = result.of(() => 42);
      assert.ok(numberResult.is_ok());
      if (numberResult.is_ok()) {
        assert.strictEqual(numberResult.value, 42);
      }

      const objectResult = result.of(() => ({ name: "test" }));
      assert.ok(objectResult.is_ok());
      if (objectResult.is_ok()) {
        assert.deepStrictEqual(objectResult.value, { name: "test" });
      }

      const nullResult = result.of(() => null);
      assert.ok(nullResult.is_ok());
      if (nullResult.is_ok()) {
        assert.strictEqual(nullResult.value, null);
      }
    });

    t.test("result.of() preserves Error types", () => {
      const customError = new TypeError("Custom type error");
      const throwingFn = () => {
        throw customError;
      };
      const res = result.of(throwingFn);

      assert.ok(res.is_error());
      if (res.is_error()) {
        assert.strictEqual(res.error, customError);
        assert.ok(res.error instanceof TypeError);
      }
    });

    t.test("result.of_async() wraps successful async function", async () => {
      const asyncSuccessFn = async () => "async success";
      const res = await result.of_async(asyncSuccessFn);

      assert.ok(res.is_ok());
      if (res.is_ok()) {
        assert.strictEqual(res.value, "async success");
      }
    });

    t.test(
      "result.of_async() wraps async function that rejects with Error",
      async () => {
        const asyncThrowingFn = async () => {
          throw new Error("Async error");
        };
        const res = await result.of_async(asyncThrowingFn);

        assert.ok(res.is_error());
        if (res.is_error()) {
          assert.strictEqual(res.error.message, "Async error");
          assert.ok(res.error instanceof Error);
        }
      },
    );

    t.test(
      "result.of_async() wraps async function that rejects with non-Error",
      async () => {
        const asyncThrowingFn = async () => {
          throw "async string error";
        };
        const res = await result.of_async(asyncThrowingFn);

        assert.ok(res.is_error());
        if (res.is_error()) {
          assert.strictEqual(res.error.message, "async string error");
          assert.ok(res.error instanceof Error);
        }
      },
    );

    t.test(
      "result.of_async() works with different resolved types",
      async () => {
        const numberResult = await result.of_async(async () => 42);
        assert.ok(numberResult.is_ok());
        if (numberResult.is_ok()) {
          assert.strictEqual(numberResult.value, 42);
        }

        const arrayResult = await result.of_async(async () => [1, 2, 3]);
        assert.ok(arrayResult.is_ok());
        if (arrayResult.is_ok()) {
          assert.deepStrictEqual(arrayResult.value, [1, 2, 3]);
        }
      },
    );

    t.test("result.of_async() preserves async Error types", async () => {
      const customError = new RangeError("Custom range error");
      const asyncThrowingFn = async () => {
        throw customError;
      };
      const res = await result.of_async(asyncThrowingFn);

      assert.ok(res.is_error());
      if (res.is_error()) {
        assert.strictEqual(res.error, customError);
        assert.ok(res.error instanceof RangeError);
      }
    });

    t.test("result.of_async() properly awaits async operations", async () => {
      let counter = 0;
      const asyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return ++counter;
      };

      const res = await result.of_async(asyncFn);
      assert.ok(res.is_ok());
      if (res.is_ok()) {
        assert.strictEqual(res.value, 1);
        assert.strictEqual(counter, 1);
      }
    });

    t.test(
      "result.of() and result.of_async() work with JSON parsing example",
      async () => {
        // Sync JSON parsing
        const validJson = result.of(() => JSON.parse('{"name": "John"}'));
        assert.ok(validJson.is_ok());
        if (validJson.is_ok()) {
          assert.strictEqual(validJson.value.name, "John");
        }

        const invalidJson = result.of(() => JSON.parse("invalid json"));
        assert.ok(invalidJson.is_error());
        if (invalidJson.is_error()) {
          assert.ok(invalidJson.error instanceof SyntaxError);
        }

        // Async version
        const asyncValidJson = await result.of_async(async () =>
          JSON.parse('{"age": 30}'),
        );
        assert.ok(asyncValidJson.is_ok());
        if (asyncValidJson.is_ok()) {
          assert.strictEqual(asyncValidJson.value.age, 30);
        }
      },
    );
  });

  t.test("Retry Function", async (t) => {
    t.test("returns Ok on first success", () => {
      let attempts = 0;
      const successFn = () => {
        attempts++;
        return result.ok(`success after ${attempts} attempts`);
      };

      const retryResult = result.retry(successFn, 3);
      assert.ok(retryResult.is_ok());
      if (retryResult.is_ok()) {
        assert.strictEqual(retryResult.value, "success after 1 attempts");
      }
      assert.strictEqual(attempts, 1);
    });

    t.test("retries until success", () => {
      let attempts = 0;
      const eventualSuccessFn = () => {
        attempts++;
        if (attempts < 3) {
          return result.error(new Error(`Attempt ${attempts} failed`));
        }
        return result.ok(`success after ${attempts} attempts`);
      };

      const retryResult = result.retry(eventualSuccessFn, 5);
      assert.ok(retryResult.is_ok());
      if (retryResult.is_ok()) {
        assert.strictEqual(retryResult.value, "success after 3 attempts");
      }
      assert.strictEqual(attempts, 3);
    });

    t.test("fails after exhausting all retries", () => {
      let attempts = 0;
      const alwaysFailFn = () => {
        attempts++;
        return result.error(new Error(`Attempt ${attempts} failed`));
      };

      const retryResult = result.retry(alwaysFailFn, 3);
      assert.ok(retryResult.is_error());
      if (retryResult.is_error()) {
        assert.strictEqual(retryResult.error.name, "Result Retry Error");
        assert.strictEqual(retryResult.error.message, "Failed after 3 attempts.");
        assert.strictEqual(retryResult.error.errors.length, 3);
        assert.strictEqual(retryResult.error.errors[0].message, "Attempt 1 failed");
        assert.strictEqual(retryResult.error.errors[1].message, "Attempt 2 failed");
        assert.strictEqual(retryResult.error.errors[2].message, "Attempt 3 failed");
      }
      assert.strictEqual(attempts, 3);
    });

    t.test("handles zero retries", () => {
      let attempts = 0;
      const failFn = () => {
        attempts++;
        return result.error(new Error("Always fails"));
      };

      const retryResult = result.retry(failFn, 0);
      assert.ok(retryResult.is_error());
      if (retryResult.is_error()) {
        assert.strictEqual(retryResult.error.name, "Result Retry Error");
        assert.strictEqual(retryResult.error.message, "Failed after 0 attempts.");
        assert.strictEqual(retryResult.error.errors.length, 0);
      }
      assert.strictEqual(attempts, 0);
    });

    t.test("handles single retry", () => {
      let attempts = 0;
      const failOnceFn = () => {
        attempts++;
        if (attempts === 1) {
          return result.error(new Error("First attempt failed"));
        }
        return result.ok("Second attempt succeeded");
      };

      const retryResult = result.retry(failOnceFn, 1);
      assert.ok(retryResult.is_error());
      if (retryResult.is_error()) {
        assert.strictEqual(retryResult.error.name, "Result Retry Error");
        assert.strictEqual(retryResult.error.message, "Failed after 1 attempts.");
        assert.strictEqual(retryResult.error.errors.length, 1);
        assert.strictEqual(retryResult.error.errors[0].message, "First attempt failed");
      }
      assert.strictEqual(attempts, 1);
    });

    t.test("works with different value types", () => {
      const numberFn = () => result.ok(42);
      const numberResult = result.retry(numberFn, 1);
      assert.ok(numberResult.is_ok());
      if (numberResult.is_ok()) {
        assert.strictEqual(numberResult.value, 42);
      }

      const objectFn = () => result.ok({ name: "test" });
      const objectResult = result.retry(objectFn, 1);
      assert.ok(objectResult.is_ok());
      if (objectResult.is_ok()) {
        assert.deepStrictEqual(objectResult.value, { name: "test" });
      }

      const nullFn = () => result.ok(null);
      const nullResult = result.retry(nullFn, 1);
      assert.ok(nullResult.is_ok());
      if (nullResult.is_ok()) {
        assert.strictEqual(nullResult.value, null);
      }
    });

    t.test("works with different error types", () => {
      class CustomError extends Error {
        code: number;
        constructor(message: string, code: number) {
          super(message);
          this.name = "CustomError";
          this.code = code;
        }
      }

      let attempts = 0;
      const customErrorFn = () => {
        attempts++;
        return result.error(new CustomError(`Custom error ${attempts}`, 500 + attempts));
      };

      const retryResult = result.retry(customErrorFn, 2);
      assert.ok(retryResult.is_error());
      if (retryResult.is_error()) {
        assert.strictEqual(retryResult.error.name, "Result Retry Error");
        assert.strictEqual(retryResult.error.message, "Failed after 2 attempts.");
        assert.strictEqual(retryResult.error.errors.length, 2);
        assert.ok(retryResult.error.errors[0] instanceof CustomError);
        assert.ok(retryResult.error.errors[1] instanceof CustomError);
        assert.strictEqual((retryResult.error.errors[0] as CustomError).code, 501);
        assert.strictEqual((retryResult.error.errors[1] as CustomError).code, 502);
      }
    });

    t.test("preserves error collection across attempts", () => {
      const errors = [
        new Error("First error"),
        new TypeError("Second error"),
        new RangeError("Third error")
      ];
      let attempts = 0;
      
      const multiErrorFn = () => {
        const error = errors[attempts];
        attempts++;
        return result.error(error);
      };

      const retryResult = result.retry(multiErrorFn, 3);
      assert.ok(retryResult.is_error());
      if (retryResult.is_error()) {
        assert.strictEqual(retryResult.error.errors.length, 3);
        assert.strictEqual(retryResult.error.errors[0], errors[0]);
        assert.strictEqual(retryResult.error.errors[1], errors[1]);
        assert.strictEqual(retryResult.error.errors[2], errors[2]);
        assert.ok(retryResult.error.errors[0] instanceof Error);
        assert.ok(retryResult.error.errors[1] instanceof TypeError);
        assert.ok(retryResult.error.errors[2] instanceof RangeError);
      }
    });

    t.test("can be chained with other Result operations", () => {
      let attempts = 0;
      const eventualSuccessFn = () => {
        attempts++;
        if (attempts < 2) {
          return result.error(new Error(`Attempt ${attempts} failed`));
        }
        return result.ok(10);
      };

      const chainedResult = result.retry(eventualSuccessFn, 3)
        .map(value => value * 2)
        .and_then(value => value > 15 ? result.ok(value) : result.error(new Error("Too small")));

      assert.ok(chainedResult.is_ok());
      if (chainedResult.is_ok()) {
        assert.strictEqual(chainedResult.value, 20);
      }
    });

    t.test("retry error can be handled with match", () => {
      const alwaysFailFn = () => result.error(new Error("Always fails"));
      
      const retryResult = result.retry(alwaysFailFn, 2);
      const matchResult = retryResult.match({
        on_ok: (value) => `Success: ${value}`,
        on_error: (error) => `Failed with ${error.errors.length} errors: ${error.message}`
      });

      assert.strictEqual(matchResult, "Failed with 2 errors: Failed after 2 attempts.");
    });
  });
});
