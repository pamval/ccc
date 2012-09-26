
pvc.BoxplotPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    
    _v1DimRoleName: {
        'series':   'series',
        'category': 'category',
        'value':    'median'
    },
    
    /**
     * @override
     */
    _createCore: function(){

        this.base();
        
        var rootScene = this._buildScene();

        var a_bottom = this.isOrientationVertical() ? "bottom" : "left",
            a_left   = this.anchorOrtho(a_bottom),
            a_width  = this.anchorLength(a_bottom),
            a_height = this.anchorOrthoLength(a_bottom),
            strokeColor  = pv.color(this.boxplotColor),
            boxFillColor = pv.color('limegreen')
            ;

        /* Category Panel */
        this.pvBoxPanel = new pvc.visual.Panel(this, this.pvPanel, {
                extensionId: ['boxPanel', 'box']
            })
            .lock('data', rootScene.childNodes)
            .lockMark(a_left, function(scene){
                var catVar = scene.vars.category;
                return catVar.x - catVar.width / 2;
            })
            .pvMark
            [a_width](function(scene){ return scene.vars.category.width; })
            ;
        
        /* V Rules */
        function setupVRule(rule){
            rule.lock(a_left, function(){ 
                    return this.pvMark.parent[a_width]() / 2;
                })
                .override('defaultColor', function(type){
                    if(type === 'stroke') { 
                        return strokeColor;
                    }
                })
                ;

            return rule;
        }

        this.pvVRuleTop = setupVRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxVRule',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(scene){
                return scene.vars.category.showVRuleAbove && this.delegateExtension(true);
            })
            .lock(a_bottom, function(scene){ return scene.vars.category.vRuleAboveBottom; })
            .lock(a_height, function(scene){ return scene.vars.category.vRuleAboveHeight; })
            .pvMark
            ;

        this.pvVRuleBot = setupVRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxVRule',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(scene){
                return scene.vars.category.showVRuleBelow && this.delegateExtension(true);
            })
            .lock(a_bottom, function(scene){ return scene.vars.category.vRuleBelowBottom; })
            .lock(a_height, function(scene){ return scene.vars.category.vRuleBelowHeight; })
            .pvMark
            ;

        /* Box Bar */
        function setupHCateg(sign){
            sign.lock(a_left,  function(scene){ return scene.vars.category.boxLeft;  })
                .lock(a_width, function(scene){ return scene.vars.category.boxWidth; })
                ;
            
            return sign;
        }

        this.pvBar = setupHCateg(new pvc.visual.Bar(this, this.pvBoxPanel, {
                extensionId:   'boxBar',
                freePosition:  true,
                normalStroke:  true
            }))
            .intercept('visible', function(scene){
                return scene.vars.category.showBox && this.delegateExtension(true);
            })
            .lock(a_bottom, function(scene){ return scene.vars.category.boxBottom; })
            .lock(a_height, function(scene){ return scene.vars.category.boxHeight; })
            .override('defaultColor', function(type){
                switch(type){
                    case 'fill':   return boxFillColor;
                    case 'stroke': return strokeColor;
                }
            })
            .override('defaultStrokeWidth', def.fun.constant(1))
            .pvMark
            ;

        /* H Rules */
        function setupHRule(rule){
            setupHCateg(rule);
            
            rule.override('defaultColor', function(type){
                    if(type === 'stroke') { return strokeColor; }
                })
                ;
            return rule;
        }
        
        this.pvHRule5 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxHRule5',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(){
                return this.scene.vars.percentil5.value != null && this.delegateExtension(true);
            })
            .lock(a_bottom,  function(){ return this.scene.vars.percentil5.position; }) // bottom
            .pvMark
            ;

        this.pvHRule95 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxHRule95',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(){
                return this.scene.vars.percentil95.value != null && this.delegateExtension(true);
            })
            .lock(a_bottom,  function(){ return this.scene.vars.percentil95.position; }) // bottom
            .pvMark
            ;

        this.pvHRule50 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:   'boxHRule50',
                freePosition:  true,
                noHover:       false,
                noSelect:      false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(){
                return this.scene.vars.median.value != null && this.delegateExtension(true);
            })
            .lock(a_bottom,  function(){ return this.scene.vars.median.position; }) // bottom
            .override('defaultStrokeWidth', def.fun.constant(2))
            .pvMark
            ;
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvBoxPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum or group, or null.
     * @override
     */
    _getSelectableMarks: function(){
        return [this.pvBar];
    },

    _buildScene: function(){
        var chart = this.chart,
            measureRolesDimNames = def.query(chart.measureVisualRoles()).object({
                name:  function(role){ return role.name; },
                value: function(role){ return role.firstDimensionName(); }
            }),
            visibleKeyArgs = {visible: true, zeroIfNone: false},
            data = this._getVisibleData(),
            rootScene  = new pvc.visual.Scene(null, {panel: this, group: data}),
            baseScale  = chart.axes.base.scale,
            bandWidth  = baseScale.range().band,
            boxWidth   = Math.min(bandWidth * this.boxSizeRatio, this.maxBoxSize),
            orthoScale = chart.axes.ortho.scale
            ;

        /**
         * Create starting scene tree
         */
        data.children() // categories
            .each(createCategScene, this);

        return rootScene;
        
        function createCategScene(categData){
            var categScene = new pvc.visual.Scene(rootScene, {group: categData}),
                vars = categScene.vars;
            
            var catVar = vars.category = new pvc.visual.ValueLabelVar(
                                    categData.value,
                                    categData.label);
            def.set(catVar,
                'group',    categData,
                'x',        baseScale(categData.value),
                'width',    bandWidth,
                'boxWidth', boxWidth,
                'boxLeft',  bandWidth / 2 - boxWidth / 2);
            
            chart.measureVisualRoles().forEach(function(role){
                var dimName = measureRolesDimNames[role.name],
                    svar;

                if(dimName){
                    var dim = categData.dimensions(dimName),
                        value = dim.sum(visibleKeyArgs);
                    
                    svar = new pvc.visual.ValueLabelVar(value, dim.format(value));
                    svar.position = orthoScale(value);
                } else {
                    svar = new pvc.visual.ValueLabelVar(null, "");
                    svar.position = null;
                }

                vars[role.name] = svar;
            });

            var has05 = vars.percentil5.value  != null,
                has25 = vars.percentil25.value != null,
                has50 = vars.median.value != null,
                has75 = vars.percentil75.value != null,
                bottom,
                top;

            var show = has25 || has75;
            if(show){
                bottom = has25 ? vars.percentil25.position :
                         has50 ? vars.median.position :
                         vars.percentil75.position
                         ;

                top    = has75 ? vars.percentil75.position :
                         has50 ? vars.median.position :
                         vars.percentil25.position
                         ;

                show = (top !== bottom);
                if(show){
                    catVar.boxBottom = bottom;
                    catVar.boxHeight = top - bottom;
                }
            }
            
            catVar.showBox  = show;
            
            // vRules
            show = vars.percentil95.value != null;
            if(show){
                bottom = has75 ? vars.percentil75.position :
                         has50 ? vars.median.position :
                         has25 ? vars.percentil25.position :
                         has05 ? vars.percentil5.position  :
                         null
                         ;
                
                show = bottom != null;
                if(show){
                    catVar.vRuleAboveBottom = bottom;
                    catVar.vRuleAboveHeight = vars.percentil95.position - bottom;
                }
            }

            catVar.showVRuleAbove = show;

            // ----

            show = has05;
            if(show){
                top = has25 ? vars.percentil25.position :
                      has50 ? vars.median.position :
                      has75 ? vars.percentil75.position :
                      null
                      ;

                show = top != null;
                if(show){
                    bottom = vars.percentil5.position;
                    catVar.vRuleBelowHeight = top - bottom;
                    catVar.vRuleBelowBottom = bottom;
                }
            }
            
            catVar.showVRuleBelow = show;
            
            // has05 = vars.percentil5.value  != null,
        }
    }
});