/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: "#FF9900",
        azure: "#0078D4",
        gcp: "#4285F4",
        aliyun: "#FF6A00",
        huawei: "#CF0A2C",
        tencent: "#006EFF",
        ucloud: "#00A0E9",
      },
    },
  },
  plugins: [],
};
