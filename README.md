<p align="center">
    <img src="https://user-images.githubusercontent.com/6702424/120405033-efe83900-c347-11eb-9a7c-7b680c26a18c.png">  
</p>
<p align="center">
    <i>A modern UI toolkit with excellent typing.</i><br>
    <i>Highly customizable but looks great out of the box.</i><br>
    <i>Build on top of material-ui.</i>
    <br>
    <br>
    <img src="https://github.com/garronej/onyxia-ui/workflows/ci/badge.svg?branch=main">
    <img src="https://img.shields.io/bundlephobia/minzip/onyxia-ui">
    <img src="https://img.shields.io/npm/dw/onyxia-ui">
    <img src="https://img.shields.io/npm/l/onyxia-ui">
</p>
<p align="center">
  <a href="https://ui.onyxia.dev">Documentation</a>
</p>

`onyxia-ui` is a ui toolkit for React build on top of [`material-ui`](https://material-ui.com).

Design by [Marc Hufschmitt](http://marchufschmitt.fr/)

# Showcase

Some apps using this toolkit.

-   [datalab.sspcloud.fr](https://datalab.sspcloud.fr/catalog/inseefrlab-helm-charts-datascience)
-   [onyxia.dev](https://onyxia.dev)
-   [sspcloud.fr](https://sspcloud.fr)

# Motivation

[Material-ui](https://material-ui.com) is at it's core a vanilla JavaScript library.  
We argue that the experience for TypeScript developers is not optimal and somewhat frustrating.
In consequence, we wanted to create a ui toolkit that would be compatible with
`material-ui` components but that would also improves it in the following ways:

-   Providing better typing.
-   Arguably better styling API: [TSS](https://github.com/garronej/tss-react).
-   Built in support for dark mode, persistent across reload, without white flashes.
-   Enable the app to look the same regardless of the screen size (You should eventually implement responsive design tho).
-   Easier, more guided, theme customization.
-   Provide splash screen that hides your components while they are not yet loaded.
-   Provides smarter core components that requires less boiler plate.

# Quick start

```bash
yarn add onyxia-ui tss-react
```

`src/theme.ts`:

```tsx
import {
    createThemeProvider,
    defaultPalette,
    createDefaultColorUseCases,
    defaultTypography,
} from "onyxia-ui/lib";
import "onyxia-design-lab/assets/fonts/work-sans.css";
import { createUseClassNamesFactory } from "tss-react";

const { ThemeProvider, useTheme } = createThemeProvider({
    //We keep the default color palette but we add a custom color: a shiny pink.
    "typography": {
        ...defaultTypography,
        "fontFamily": '"Work Sans", sans-serif',
    },
    "palette": {
        ...defaultPalette,
        "shinyPink": {
            "main": "#3333",
        },
    },
    //We keep the default surceases colors except that we add
    //a new usage scenario: "flash" and we use our pink within.
    "createColorUseCases": ({ isDarkModeEnabled, palette }) => ({
        ...createDefaultColorUseCases({ isDarkModeEnabled, palette }),
        "flashes": {
            "cute": palette.shinyPink.main,
            "warning": palette.orangeWarning.light,
        },
    }),
    //Enable the app to look exactly the same regardless of the screen size.
    //This shouldn't be defined if you have implemented responsive design.
    "zoomProviderReferenceWidth": 1920,
});

export { ThemeProvider };

export const { createUseClassNames } = createUseClassNamesFactory({ useTheme });
```

`src/index.tsx`:

```tsx
import * as ReactDOM from "react-dom";
import { ThemeProvider } from "./theme";
import { MyComponent } from "./MyComponent.txt";
import { SplashScreenProvider } from "onyxia-ui/splashScreen";
import { ReactComponent as CompanyLogoSvg } from "./company-logo.svg";

ReactDOM.render(
    <ThemeProvider>
        <SplashScreenProvider Logo={CompanyLogo}>
            <MyComponent />
        </SplashScreenProvider>
    </ThemeProvider>,
    document.getElementById("root"),
);
```

`src/MyComponent.tsx`:

```tsx
import { useEffect } from "react";
import { createUseClassNames } from "./theme.ts";
//Cherry pick the custom components you wish to import.
import { Button } from "onyxia-ui/Button";
//Use this hook to know if the dark mode is currently enabled.
//and to toggle it's state.
import { useIsDarkModeEnabled } from "onyxia-ui/lib";
//Yo can import and use Materia-UI components, they will blend in nicely.
import Switch from "@material-ui/core/Switch";
import { hideSplashScreen } from "onyxia-ui/splashScreen";

//See: https://github.com/garronej/tss-react
const { useClassNames } = createUseClassNames()(theme => ({
    "root": {
        "backgroundColor": theme.colors.useCases.surfaces.background,
        /*
        theme.colors.palette.shinyPink.main <- your custom color
        theme.colors.useCases.flashes.cute  <- your custom use case
        theme.muiTheme                      <- the theme object as defined by @material-ui/core
        */
    },
}));

function MyComponent() {
    const { isDarkModeEnabled, setIsDarkModeEnabled } = useIsDarkModeEnabled();

    const { classNames } = useClassNames({});

    useEffect(() => {
        //Call this when your component is in a state ready to be shown
        hideSplashScreen();
    }, []);

    return (
        <div className={classNames.root}>
            <Button onClick={() => console.log("click")}>Hello World</Button>
            <Switch
                checked={isDarkModeEnabled}
                onChange={() => setIsDarkModeEnabled(!isDarkModeEnabled)}
            />
        </div>
    );
}
```
