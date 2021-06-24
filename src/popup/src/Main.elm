module Main exposing (main)

import Browser
import Focus
import Html exposing (Html, button, div, h1, h2, input, text)
import Html.Attributes exposing (attribute, class, placeholder, style, value)
import Html.Events exposing (onClick, onInput)
import Language



{------------------------------
 -
 - Main
 -
 ------------------------------}


main : Program () Model Msg
main =
    Browser.document
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



{------------------------------
 -
 - Model
 -
 ------------------------------}


type alias Model =
    { translateLanguage : Language.Model
    , focus : Focus.Model
    }



{------------------------------
 -
 - init
 -
 ------------------------------}


init : () -> ( Model, Cmd Msg )
init _ =
    ( { translateLanguage = Language.init
      , focus = Focus.init
      }
    , Cmd.batch
        [ Language.getLanguage ()
        , Focus.getFocus ()
        ]
    )



{------------------------------
 -
 - Msg
 -
 ------------------------------}


type Msg
    = LanguageMsg Language.Msg
    | FocusMsg Focus.Msg



{------------------------------
 -
 - Update
 -
 ------------------------------}


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        LanguageMsg langMsg ->
            let
                ( langModel, langCmd ) =
                    Language.update langMsg model.translateLanguage
            in
            ( { model | translateLanguage = langModel }, Cmd.map LanguageMsg langCmd )

        FocusMsg focusMsg ->
            let
                ( focusModel, focusCmd ) =
                    Focus.update focusMsg model.focus
            in
            ( { model | focus = focusModel }, Cmd.map FocusMsg focusCmd )



{------------------------------
 -
 - subscriptions
 -
 ------------------------------}


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ Sub.map LanguageMsg Language.subscriptions
        , Sub.map FocusMsg Focus.subscriptions
        ]



{------------------------------
 -
 - view
 -
 ------------------------------}


view : Model -> Browser.Document Msg
view model =
    { title = "PopupMenu"
    , body =
        [ div [ class "popup_wrapper" ]
            [ Html.map LanguageMsg <| Language.popupView model.translateLanguage
            , Html.map FocusMsg <| Focus.popupView model.focus
            ]
        ]
    }
