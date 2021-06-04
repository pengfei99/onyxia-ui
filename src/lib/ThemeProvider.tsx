/* eslint-disable @typescript-eslint/ban-types */
import type { ReactNode } from "react";
import type { Theme as MuiTheme } from "@material-ui/core";
import { useIsDarkModeEnabled, evtIsDarkModeEnabled } from "./useIsDarkModeEnabled";
import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider as MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import { createMuiTheme, unstable_createMuiStrictModeTheme } from "@material-ui/core/styles";
import { responsiveFontSizes } from "@material-ui/core/styles";
import memoize from "memoizee";
import { createObjectThatThrowsIfAccessed } from "../tools/createObjectThatThrowsIfAccessed";

import type { PaletteBase, ColorUseCasesBase, CreateColorUseCase } from "./colors";
import { defaultPalette, createDefaultColorUseCases } from "./colors";
import type { TypographyOptionsBase } from "./typography";
import { defaultTypography, createMuiTypographyOptions } from "./typography";
import { createMuiPaletteOptions } from "./colors";
import { createUseGlobalState } from "powerhooks";
import { createUseClassNamesFactory } from "tss-react";
import { shadows } from "./shadows";
import { ZoomProvider } from "powerhooks";

export type Theme<
    Palette extends PaletteBase,
    ColorUseCases extends ColorUseCasesBase,
    TypographyOptions extends TypographyOptionsBase,
    Custom extends Record<string, unknown>,
> = {
    colors: {
        palette: Palette;
        useCases: ColorUseCases;
    };
    isDarkModeEnabled: boolean;
    typography: TypographyOptions;
    shadows: typeof shadows;
    spacing: MuiTheme["spacing"];
    muiTheme: MuiTheme;
    custom: Custom;
};

const { useThemeBase, evtThemeBase } = createUseGlobalState(
    "themeBase",
    //NOTE We should be able to use Record<string, never> as Custom here...
    createObjectThatThrowsIfAccessed<
        Theme<PaletteBase, ColorUseCasesBase, TypographyOptionsBase, Record<string, unknown>>
    >({
        "debugMessage": "You must invoke createThemeProvider() before being able to use the components",
    }),
    { "persistance": false },
);

export { useThemeBase };

export const { createUseClassNames } = createUseClassNamesFactory({
    "useTheme": function useClosure() {
        const { themeBase } = useThemeBase();
        return themeBase;
    },
});

export function createThemeProvider<
    Palette extends PaletteBase = PaletteBase,
    ColorUseCases extends ColorUseCasesBase = ColorUseCasesBase,
    TypographyOptions extends TypographyOptionsBase = TypographyOptionsBase,
    Custom extends Record<string, unknown> = Record<string, never>,
>(
    params: {
        isReactStrictModeEnabled?: boolean;
        typography?: TypographyOptions;
        palette?: Palette;
        createColorUseCases?: CreateColorUseCase<Palette, ColorUseCases>;
        spacingSteps?(factor: number): number;
        custom?: Custom;
    } & (
        | {}
        | {
              zoomProviderReferenceWidth: number | undefined;
              /**
               * Message to display when portrait mode, example:
               *    This app isn't compatible with landscape mode yet,
               *    please enable the rotation sensor and flip your phone.
               */
              portraitModeUnsupportedMessage?: ReactNode;
          }
    ),
) {
    const {
        palette = defaultPalette as NonNullable<typeof params["palette"]>,
        createColorUseCases = createDefaultColorUseCases as unknown as NonNullable<
            typeof params["createColorUseCases"]
        >,
        typography = defaultTypography as NonNullable<typeof params["typography"]>,
        isReactStrictModeEnabled = false,
        spacingSteps = factor => 8 * factor,
        custom = {} as NonNullable<typeof params["custom"]>,
    } = params;

    const createColorUseCases_memo = memoize(
        (isDarkModeEnabled: boolean) => createColorUseCases({ palette, isDarkModeEnabled }),
        //NOTE: Max 1 because a bug in MUI4 forces us to provide a new ref of the theme
        //each time we switches or we end up with colors bugs.
        { "max": 1 },
    );

    const createMuiTheme_memo = memoize(
        (isDarkModeEnabled: boolean) =>
            responsiveFontSizes(
                //https://material-ui.com/customization/theming/#responsivefontsizes-theme-options-theme
                (isReactStrictModeEnabled ? unstable_createMuiStrictModeTheme : createMuiTheme)({
                    // https://material-ui.com/customization/palette/#using-a-color-object
                    "typography": createMuiTypographyOptions({ typography }),
                    "palette": createMuiPaletteOptions({
                        isDarkModeEnabled,
                        palette,
                        "useCases": createColorUseCases_memo(isDarkModeEnabled),
                    }),
                    "spacing": spacingSteps,
                }),
            ),
        { "max": 1 },
    );

    const { ThemeProvider } = (() => {
        const zoomProviderParams =
            "zoomProviderReferenceWidth" in params
                ? ({ "doUseZoomProvider": true, ...params } as const)
                : ({ "doUseZoomProvider": false } as const);

        function ThemeProvider(props: { children: React.ReactNode }) {
            const { children } = props;

            const { isDarkModeEnabled } = useIsDarkModeEnabled();

            return (
                <MuiThemeProvider theme={createMuiTheme_memo(isDarkModeEnabled)}>
                    <CssBaseline />
                    <StylesProvider injectFirst>
                        {zoomProviderParams.doUseZoomProvider ? (
                            <ZoomProvider
                                referenceWidth={zoomProviderParams.zoomProviderReferenceWidth}
                                portraitModeUnsupportedMessage={
                                    zoomProviderParams.portraitModeUnsupportedMessage
                                }
                            >
                                {children}
                            </ZoomProvider>
                        ) : (
                            children
                        )}
                    </StylesProvider>
                </MuiThemeProvider>
            );
        }

        return { ThemeProvider };
    })();

    const createTheme_memo = memoize(
        (isDarkModeEnabled): Theme<Palette, ColorUseCases, TypographyOptions, Custom> => ({
            "colors": {
                palette,
                "useCases": createColorUseCases_memo(isDarkModeEnabled),
            },
            typography,
            isDarkModeEnabled,
            shadows,
            ...(() => {
                const muiTheme = createMuiTheme_memo(isDarkModeEnabled);
                return {
                    "spacing": muiTheme.spacing.bind(muiTheme),
                    muiTheme,
                };
            })(),
            custom,
        }),
        { "max": 1 },
    );

    evtIsDarkModeEnabled.attach(
        isDarkModeEnabled => (evtThemeBase.state = createTheme_memo(isDarkModeEnabled)),
    );

    function useTheme(): Theme<Palette, ColorUseCases, TypographyOptions, Custom> {
        const { isDarkModeEnabled } = useIsDarkModeEnabled();
        return createTheme_memo(isDarkModeEnabled);
    }

    return { ThemeProvider, useTheme };
}
