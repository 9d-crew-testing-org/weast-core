import subprocess
import time
import sys

NODE_COMMAND = ["node", "loop.js"]   # change to your file
ERROR_TRIGGER = "error"
ERROR_LIMIT = 2                     # restart after this many errors
RESTART_DELAY = 2                   # seconds


def run_node():
    print("Starting Node process...\n")

    error_count = 0

    process = subprocess.Popen(
        NODE_COMMAND,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    try:
        for line in process.stdout:
            print(line, end="")  # live output

            # Check for error keyword
            if ERROR_TRIGGER.lower() in line.lower():
                error_count += 1
                print(f"[Error detected {error_count}/{ERROR_LIMIT}]")

                if error_count >= ERROR_LIMIT:
                    print("\n⚠️ Error limit reached — restarting process...")
                    process.kill()
                    return

        process.wait()

    except KeyboardInterrupt:
        print("\nStopping...")
        process.kill()
        sys.exit(0)


if __name__ == "__main__":
    while True:
        run_node()
        print(f"Restarting in {RESTART_DELAY}s...\n")
        time.sleep(RESTART_DELAY)

